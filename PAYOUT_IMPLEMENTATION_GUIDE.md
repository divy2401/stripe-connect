# Payout Schedule Implementation Guide

Quick reference for implementing and using the payout schedule system.

## 🔄 Core Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Add Bank Accounts                                        │
│    User → Stripe.js Token → Backend → Stripe Account        │
│    Result: Multiple bank accounts saved                      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Configure Payout Schedule                                 │
│    User selects: Schedule Type + Rotation Strategy           │
│    Backend: disableAutomaticPayouts()                       │
│    Result: Schedule saved, Stripe auto-payouts disabled     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Automatic Payout Processing                              │
│    Cron Job → Check due payouts                             │
│    For each business:                                       │
│      - Check balance >= minimum                             │
│      - Select bank account (rotation strategy)               │
│      - Create payout via Stripe API                         │
│      - Update schedule tracking                             │
│    Result: Payouts distributed across bank accounts        │
└─────────────────────────────────────────────────────────────┘
```

## 💻 Code Implementation Examples

### **1. Disabling Stripe Auto-Payouts**

After user enables payout schedule, automatically disable Stripe's default daily payouts:

```typescript
// When schedule is enabled
if (dto.isEnabled) {
  await this.stripe.disableAutomaticPayouts(business.stripeAccountId);
}

// Stripe Service Implementation
async disableAutomaticPayouts(accountId: string): Promise<Stripe.Account> {
  return await this.stripe.accounts.update(accountId, {
    settings: {
      payouts: {
        schedule: {
          interval: "manual" as const, // Disables automatic daily payouts
        },
      },
    },
  });
}
```

**Why**: This gives you full control over when and which bank account receives payouts, preventing Stripe from automatically paying out daily to the default account.

---

### **2. Bank Account Rotation Selection**

Determine which bank account to use for the next payout:

```typescript
async getNextBankAccount(
  businessId: string,
  schedule: PayoutSchedule
): Promise<string> {
  const bankAccounts = await this.bankAccountService.getBankAccounts(businessId);
  
  if (bankAccounts.length === 1) {
    return bankAccounts[0].id;
  }

  switch (schedule.rotationStrategy) {
    case PayoutRotationStrategy.ROUND_ROBIN:
      // Cycle through accounts: A → B → C → A
      const lastIndex = bankAccounts.findIndex(
        ba => ba.id === schedule.lastUsedBankAccountId
      );
      const nextIndex = (lastIndex + 1) % bankAccounts.length;
      return bankAccounts[nextIndex].id;

    case PayoutRotationStrategy.ALTERNATE_MONTHLY:
      // Month-based: Jan→A, Feb→B, Mar→C, Apr→A
      const currentMonth = new Date().getMonth();
      return bankAccounts[currentMonth % bankAccounts.length].id;

    case PayoutRotationStrategy.ALTERNATE_WEEKLY:
      // Week-based: Week1→A, Week2→B, Week3→C, Week4→A
      const weekNumber = this.getWeekNumber(new Date());
      return bankAccounts[weekNumber % bankAccounts.length].id;

    case PayoutRotationStrategy.FIXED:
      // Always use default account
      const defaultAccount = bankAccounts.find(ba => ba.isDefault);
      return defaultAccount?.id || bankAccounts[0].id;
  }
}
```

---

### **3. Creating Payout to Specific Bank Account**

Process payout to the selected bank account:

```typescript
async processScheduledPayout(businessId: string): Promise<any> {
  // 1. Get schedule
  const schedule = await this.getSchedule(businessId);
  
  // 2. Check balance
  const balance = await this.payoutService.getBusinessPendingBalance(businessId);
  if (balance.netAmount < schedule.minimumPayoutAmount) {
    return { message: "Balance below minimum" };
  }

  // 3. Select bank account using rotation strategy
  const bankAccountId = await this.getNextBankAccount(businessId, schedule);
  const bankAccount = await this.prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  const business = await this.businessService.getBusinessById(businessId);

  // 4. Set bank account as default temporarily
  await this.stripe.setDefaultExternalAccount(
    business.stripeAccountId,
    bankAccount.externalAccountId
  );

  // 5. Create payout (Stripe uses default account)
  const stripePayout = await this.stripe.payouts.create(
    {
      amount: balance.netAmount,
      currency: "usd",
    },
    {
      stripeAccount: business.stripeAccountId,
    }
  );

  // 6. Record payout in database
  await this.prisma.payout.create({
    data: {
      businessId,
      bankAccountId,              // Track which account was used
      stripePayoutId: stripePayout.id,
      amount: balance.netAmount,
      currency: "usd",
      status: stripePayout.status,
      reason: `Scheduled payout (${schedule.scheduleType})`,
      isScheduled: true,
    },
  });

  // 7. Update schedule tracking
  const nextDate = this.calculateNextPayoutDate(schedule);
  await this.prisma.payoutSchedule.update({
    where: { businessId },
    data: {
      lastUsedBankAccountId: bankAccountId,
      rotationCounter: schedule.rotationCounter + 1,
      nextPayoutDate: nextDate,
      lastPayoutDate: new Date(),
    },
  });

  return { success: true, payoutId: stripePayout.id };
}
```

---

### **4. Processing All Scheduled Payouts (Cron Job)**

Run this periodically to process all due payouts:

```typescript
async processAllScheduledPayouts(): Promise<{
  processed: number;
  skipped: number;
  errors: number;
  results: any[];
}> {
  // 1. Find all schedules due for payout
  const schedules = await this.prisma.payoutSchedule.findMany({
    where: {
      isEnabled: true,
      nextPayoutDate: {
        lte: new Date(), // Due now or past due
      },
    },
  });

  const results: any[] = [];
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // 2. Process each schedule
  for (const schedule of schedules) {
    try {
      const result = await this.processScheduledPayout(schedule.businessId);
      results.push({
        businessId: schedule.businessId,
        ...result,
      });
      
      if (result.success) {
        processed++;
      } else {
        skipped++;
      }
    } catch (error: any) {
      errors++;
      results.push({
        businessId: schedule.businessId,
        error: error?.message || "Unknown error",
      });
    }
  }

  return { processed, skipped, errors, results };
}
```

**Cron Setup**:
```bash
# Run every hour
0 * * * * curl -X POST https://your-api.com/payout-schedule/process-all
```

---

### **5. Calculating Next Payout Date**

Determine when the next payout should run:

```typescript
private calculateNextPayoutDate(schedule: any): Date | null {
  if (!schedule.isEnabled) return null;

  const now = new Date();
  const nextDate = new Date(now);

  switch (schedule.scheduleType) {
    case PayoutScheduleType.DAILY:
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);
      break;

    case PayoutScheduleType.WEEKLY:
      const dayOfWeek = schedule.specificDayOfWeek ?? 1; // Monday
      const currentDayOfWeek = now.getDay();
      let daysUntilNext = dayOfWeek - currentDayOfWeek;
      if (daysUntilNext <= 0) {
        daysUntilNext += 7; // Next week
      }
      nextDate.setDate(nextDate.getDate() + daysUntilNext);
      nextDate.setHours(0, 0, 0, 0);
      break;

    case PayoutScheduleType.MONTHLY:
      const dayOfMonth = schedule.specificDayOfMonth ?? 1;
      nextDate.setDate(dayOfMonth);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      nextDate.setHours(0, 0, 0, 0);
      break;

    case PayoutScheduleType.CUSTOM:
      const intervalDays = schedule.intervalDays ?? 7;
      nextDate.setDate(nextDate.getDate() + intervalDays);
      nextDate.setHours(0, 0, 0, 0);
      break;
  }

  return nextDate;
}
```

---

## 🎯 Key Configuration Points

### **When Schedule is Enabled**

```typescript
// Automatically disable Stripe's automatic payouts
await this.stripe.disableAutomaticPayouts(business.stripeAccountId);

// This prevents Stripe from:
// - Automatically paying out daily
// - Using only the default account
// - Ignoring your rotation strategy
```

### **When Creating Payout**

```typescript
// 1. Select bank account (rotation strategy)
const bankAccountId = await getNextBankAccount(businessId, schedule);

// 2. Set as default temporarily
await stripe.setDefaultExternalAccount(accountId, bankAccount.externalAccountId);

// 3. Create payout (Stripe uses default)
const payout = await stripe.payouts.create({ amount, currency }, {
  stripeAccount: connectedAccountId
});

// 4. Track which account was used
await prisma.payout.create({
  data: {
    bankAccountId,  // Important: Track rotation
    isScheduled: true,
    // ...
  }
});
```

### **Updating Schedule After Payout**

```typescript
await prisma.payoutSchedule.update({
  where: { businessId },
  data: {
    lastUsedBankAccountId: bankAccountId,  // Track for round-robin
    rotationCounter: schedule.rotationCounter + 1,  // Increment counter
    nextPayoutDate: calculateNextPayoutDate(schedule),  // Next due date
    lastPayoutDate: new Date(),  // Last successful payout
  },
});
```

---

## 📊 Rotation Strategy Examples

### **Round Robin Example**

```typescript
// Accounts: [A, B, C]
// Schedule: lastUsedBankAccountId = "B"

const lastIndex = 1; // Index of B
const nextIndex = (1 + 1) % 3 = 2; // Index of C
return accounts[2]; // Bank Account C

// Next payout: C
// After C: A (cycles back)
```

### **Alternate Monthly Example**

```typescript
// Accounts: [A, B]
// Current month: February (month = 1)

const accountIndex = 1 % 2 = 1; // Index of B
return accounts[1]; // Bank Account B

// January (month 0) → A
// February (month 1) → B
// March (month 2) → A (cycles back)
```

---

## 🔔 Webhook Handling

Listen for Stripe payout events:

```typescript
// Webhook handler for payout events
async handlePayoutWebhook(event: Stripe.Event) {
  const payout = event.data.object as Stripe.Payout;

  switch (event.type) {
    case 'payout.paid':
      // Update payout status
      await prisma.payout.update({
        where: { stripePayoutId: payout.id },
        data: { status: 'succeeded' },
      });
      break;

    case 'payout.failed':
      // Log failure, notify user
      await prisma.payout.update({
        where: { stripePayoutId: payout.id },
        data: { status: 'failed' },
      });
      
      // Optionally: Don't advance rotation counter
      // Retry with same account or notify user
      break;
  }
}
```

---

## ✅ Best Practices Checklist

- [x] **Disable Stripe auto-payouts** when schedule is enabled
- [x] **Track bank account usage** in database (`lastUsedBankAccountId`)
- [x] **Increment rotation counter** for analytics
- [x] **Calculate next payout date** accurately
- [x] **Handle minimum amounts** before processing
- [x] **Log all payout attempts** for debugging
- [x] **Handle failures gracefully** (don't advance rotation on failure)
- [x] **Support manual overrides** for immediate payouts
- [x] **Webhook integration** for real-time status updates
- [x] **Clear user communication** about which account will receive next payout

---

## 🚀 Quick Start

1. **Add bank accounts**: User adds 2+ bank accounts via UI
2. **Configure schedule**: Set schedule type and rotation strategy
3. **Enable schedule**: Automatically disables Stripe auto-payouts
4. **Set up cron**: Run `process-all` endpoint hourly
5. **Monitor**: Track payouts via webhooks and database

**Result**: Automatic payouts rotate between bank accounts according to your schedule! 🎉

