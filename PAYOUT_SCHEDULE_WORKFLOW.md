# Payout Schedule & Bank Account Rotation Workflow

This document describes the complete workflow for managing multiple bank accounts with automatic payout rotation and scheduling in Stripe Connect Custom Accounts.

## 📋 Overview

The payout schedule system allows businesses to:
- Configure custom payout schedules (Daily, Weekly, Monthly, Custom intervals)
- Rotate payouts between multiple bank accounts automatically
- Disable Stripe's default automatic daily payouts for full control
- Set minimum payout amounts
- Track payout history and rotation

---

## 🔄 Core Workflow

### 1. **Initial Setup: Add Bank Accounts**

After a business account is created, bank accounts are added using Stripe.js tokens:

```
User enters bank account details (routing, account number, holder name)
    ↓
Stripe.js creates secure token client-side (btok_xxx)
    ↓
Token sent to backend: POST /businesses/:id/bank-accounts
    ↓
Backend adds external account to Stripe connected account
    ↓
Bank account saved to database with isDefault flag
```

**First bank account automatically becomes default.**

---

### 2. **Configure Payout Schedule**

Business configures payout schedule via frontend:

```
User navigates to Payout Schedule page
    ↓
Selects schedule type (Daily/Weekly/Monthly/Custom/Manual)
    ↓
Chooses rotation strategy (Round Robin/Alternate Monthly/Alternate Weekly/Fixed)
    ↓
Sets minimum payout amount ($10 default)
    ↓
Enables schedule: POST /payout-schedule
    ↓
Backend automatically disables Stripe's automatic daily payouts
    ↓
Next payout date calculated based on schedule
    ↓
Schedule saved to database
```

**Key Action**: When schedule is enabled, `disableAutomaticPayouts()` is called to set Stripe payout schedule to `interval: "manual"`, preventing Stripe from automatically processing daily payouts.

---

### 3. **Payout Processing Flow**

#### **Automatic Scheduled Payouts**

When a scheduled payout is due:

```
Cron job or scheduled task runs: POST /payout-schedule/process-all
    ↓
Backend queries all enabled schedules with nextPayoutDate <= now
    ↓
For each business:
    ├─ Check balance meets minimum payout amount
    ├─ Determine next bank account using rotation strategy
    ├─ Set bank account as default temporarily in Stripe
    ├─ Create payout using Stripe API
    ├─ Record payout in database with bankAccountId
    ├─ Update schedule: lastUsedBankAccountId, rotationCounter, nextPayoutDate
    └─ Return success/error
```

#### **Rotation Strategy Selection**

The system selects the next bank account based on the configured strategy:

**1. ROUND_ROBIN** (Cycles through all accounts):
```
Schedule: [Bank A, Bank B, Bank C]
Payout 1 → Bank A (lastUsedBankAccountId: A)
Payout 2 → Bank B (lastUsedBankAccountId: B)
Payout 3 → Bank C (lastUsedBankAccountId: C)
Payout 4 → Bank A (cycles back)
```

**2. ALTERNATE_MONTHLY** (Month-based rotation):
```
January → Bank A (month % accounts.length = 0)
February → Bank B (month % accounts.length = 1)
March → Bank C (month % accounts.length = 2)
April → Bank A (cycles back)
```

**3. ALTERNATE_WEEKLY** (Week-based rotation):
```
Week 1 → Bank A (weekNumber % accounts.length = 0)
Week 2 → Bank B (weekNumber % accounts.length = 1)
Week 3 → Bank C (weekNumber % accounts.length = 2)
Week 4 → Bank A (cycles back)
```

**4. FIXED** (Always uses default account):
```
All payouts → Default Bank Account
```

---

### 4. **Manual Payout Processing**

For manual payouts or immediate processing:

```
User triggers: POST /payout-schedule/process/:businessId
    ↓
Backend checks schedule is enabled
    ↓
Verifies balance >= minimum payout amount
    ↓
Selects bank account using rotation strategy
    ↓
Creates payout via Stripe API
    ↓
Updates schedule tracking
    ↓
Returns payout details
```

---

## 🎯 Implementation Details

### **Disabling Stripe Auto-Payouts**

When a payout schedule is enabled, the system automatically disables Stripe's default daily payouts:

```typescript
// Stripe Service Method
async disableAutomaticPayouts(accountId: string) {
  return await this.stripe.accounts.update(accountId, {
    settings: {
      payouts: {
        schedule: {
          interval: "manual" // Disables automatic daily payouts
        },
      },
    },
  });
}
```

**Why This Matters**: 
- Stripe's default behavior is to automatically payout daily to the default bank account
- By setting `interval: "manual"`, we gain full control over when and which bank account receives payouts
- This allows us to implement custom rotation logic

---

### **Bank Account Selection for Payouts**

Each payout determines which bank account to use:

```typescript
// 1. Get all bank accounts for business
const bankAccounts = await bankAccountService.getBankAccounts(businessId);

// 2. Select based on rotation strategy
switch (rotationStrategy) {
  case "ROUND_ROBIN":
    // Find last used account index
    const lastIndex = bankAccounts.findIndex(ba => ba.id === lastUsedBankAccountId);
    // Next index in round-robin
    const nextIndex = (lastIndex + 1) % bankAccounts.length;
    return bankAccounts[nextIndex].id;
    
  case "ALTERNATE_MONTHLY":
    const currentMonth = new Date().getMonth();
    return bankAccounts[currentMonth % bankAccounts.length].id;
    
  // ... other strategies
}

// 3. Set as default temporarily in Stripe
await stripe.setDefaultExternalAccount(accountId, selectedBankAccount.externalAccountId);

// 4. Create payout (Stripe uses default account)
const payout = await stripe.payouts.create({
  amount: balanceAmount,
  currency: "usd"
}, {
  stripeAccount: connectedAccountId
});
```

---

### **Payout Tracking**

Each payout is recorded with:

```typescript
{
  businessId: string;
  bankAccountId: string;        // Which account was used
  stripePayoutId: string;      // Stripe payout ID
  amount: number;              // In cents
  currency: string;
  status: string;              // "pending", "paid", "failed"
  isScheduled: boolean;        // true if from schedule
  reason: string;              // "Scheduled payout (MONTHLY)"
}
```

The schedule tracks:
```typescript
{
  lastUsedBankAccountId: string;  // Last account used
  rotationCounter: number;         // Total rotations
  nextPayoutDate: Date;            // When next payout runs
  lastPayoutDate: Date;           // Last successful payout
}
```

---

## 🔧 Configuration Options

### **Schedule Types**

| Type | Description | Configuration |
|------|-------------|--------------|
| **MANUAL** | No automatic payouts | None |
| **DAILY** | Every day at midnight | None |
| **WEEKLY** | Weekly on specific day | `specificDayOfWeek` (0-6) |
| **MONTHLY** | Monthly on specific day | `specificDayOfMonth` (1-31) |
| **CUSTOM** | Custom interval | `intervalDays` (number) |

### **Rotation Strategies**

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **FIXED** | Always uses default account | Single account preference |
| **ROUND_ROBIN** | Cycles through all accounts | Equal distribution |
| **ALTERNATE_MONTHLY** | Rotates monthly | Monthly distribution |
| **ALTERNATE_WEEKLY** | Rotates weekly | Weekly distribution |

---

## 📊 Database Schema

### **PayoutSchedule Model**

```prisma
model PayoutSchedule {
  id                    String                @id
  businessId            String                @unique
  scheduleType          PayoutScheduleType    // DAILY, WEEKLY, MONTHLY, etc.
  rotationStrategy      PayoutRotationStrategy // ROUND_ROBIN, etc.
  isEnabled             Boolean
  autoPayoutDisabled    Boolean               // true when enabled
  
  // Schedule config
  intervalDays          Int?                  // For CUSTOM
  specificDayOfWeek     Int?                  // 0-6 (Sunday-Saturday)
  specificDayOfMonth    Int?                  // 1-31
  minimumPayoutAmount   Int                   // In cents
  
  // Rotation tracking
  lastUsedBankAccountId String?               // Last account used
  rotationCounter       Int                   // Total rotations
  
  // Dates
  nextPayoutDate        DateTime?
  lastPayoutDate        DateTime?
}
```

---

## 🚀 Recommended Implementation Flow

### **Step 1: Add Bank Accounts**

1. User navigates to `/bank-accounts/:businessId`
2. Clicks "Add Bank Account"
3. Enters bank account details (routing, account number, holder name)
4. Stripe.js tokenizes details client-side
5. Token sent to backend → Bank account added to Stripe and database

### **Step 2: Configure Payout Schedule**

1. User navigates to `/bank-accounts/:businessId/payout-schedule`
2. Selects schedule type (Daily/Weekly/Monthly/Custom)
3. Chooses rotation strategy
4. Sets minimum payout amount
5. Enables schedule
6. **Backend automatically disables Stripe's automatic payouts**

### **Step 3: Automatic Processing**

1. **Cron Job Setup** (Recommended):
   ```bash
   # Run every hour to check for due payouts
   0 * * * * curl -X POST https://your-api.com/payout-schedule/process-all
   ```

2. **Process Flow**:
   - Query all enabled schedules where `nextPayoutDate <= now`
   - For each business:
     - Check balance >= minimum payout amount
     - Select bank account using rotation strategy
     - Create payout via Stripe API
     - Update schedule tracking
     - Calculate next payout date

3. **Webhook Handling**:
   - Listen for `payout.paid`, `payout.failed` events
   - Update payout status in database
   - Handle failures (retry logic, notifications)

### **Step 4: Manual Overrides**

Users can:
- Process payout immediately: `POST /payout-schedule/process/:businessId`
- Disable schedule: Update `isEnabled: false`
- Change rotation strategy: Update schedule configuration
- Remove bank accounts (minimum 1 required)

---

## 🎨 Best Practices

### **1. Clear Communication**

- Display next payout date prominently in UI
- Show which bank account will receive next payout
- Display rotation history and counter
- Notify users when schedule changes

### **2. Error Handling**

- **Balance too low**: Skip payout, update next date, log reason
- **Payout failed**: 
  - Update payout status to "failed"
  - Optionally retry with same account
  - Notify user via email/in-app notification
  - Don't advance rotation counter on failure

### **3. Webhook Integration**

Subscribe to Stripe webhooks:
- `payout.paid` → Update payout status, mark as successful
- `payout.failed` → Update status, log error, notify user
- `account.external_account.updated` → Sync bank account status

### **4. Monitoring**

Track:
- Payout success rate per bank account
- Average payout amount
- Rotation distribution
- Failed payout reasons
- Schedule adherence

### **5. User Control**

Allow users to:
- Enable/disable schedule anytime
- Change rotation strategy
- View payout history per bank account
- Manually trigger payouts
- Set/change minimum payout amount

---

## 🔐 Security Considerations

1. **PCI Compliance**: Bank account details never touch your server (tokenized client-side)
2. **Access Control**: Verify business ownership before allowing schedule changes
3. **Audit Trail**: All payout actions logged with timestamps and user info
4. **Validation**: Prevent removing last bank account
5. **Minimum Amounts**: Enforce minimum payout amounts to avoid micro-transactions

---

## 📝 Example Scenarios

### **Scenario 1: Monthly Rotation**

**Setup**:
- Schedule: `MONTHLY`, Day: 1st of month
- Rotation: `ALTERNATE_MONTHLY`
- Bank Accounts: [Account A, Account B]

**Flow**:
- January 1st → Payout to Account A
- February 1st → Payout to Account B
- March 1st → Payout to Account A
- (continues alternating)

### **Scenario 2: Round Robin Weekly**

**Setup**:
- Schedule: `WEEKLY`, Day: Monday
- Rotation: `ROUND_ROBIN`
- Bank Accounts: [Account A, Account B, Account C]

**Flow**:
- Week 1 → Account A
- Week 2 → Account B
- Week 3 → Account C
- Week 4 → Account A (cycles back)

### **Scenario 3: Fixed Default Account**

**Setup**:
- Schedule: `DAILY`
- Rotation: `FIXED`
- Bank Accounts: [Account A (default), Account B]

**Flow**:
- All payouts → Account A (default)
- Rotation strategy ignored, always uses default

---

## 🐛 Troubleshooting

### **Payout Not Processing**

1. Check schedule is enabled: `isEnabled = true`
2. Verify `nextPayoutDate <= now`
3. Check balance >= `minimumPayoutAmount`
4. Ensure at least one bank account exists
5. Verify Stripe account has `payouts_enabled = true`

### **Wrong Bank Account Selected**

1. Check `rotationStrategy` setting
2. Verify `lastUsedBankAccountId` is correct
3. Check bank account count matches rotation logic
4. Review `rotationCounter` for debugging

### **Stripe Still Processing Automatic Payouts**

1. Verify `disableAutomaticPayouts()` was called
2. Check Stripe dashboard → Settings → Payouts → Schedule should be "Manual"
3. Re-run disable function if needed

---

## 📚 API Reference

### **Endpoints**

- `GET /payout-schedule/:businessId` - Get schedule
- `POST /payout-schedule` - Create/update schedule
- `PUT /payout-schedule/:businessId` - Update schedule
- `POST /payout-schedule/process/:businessId` - Process payout now
- `POST /payout-schedule/process-all` - Process all due payouts (cron)

### **Key Methods**

- `disableAutomaticPayouts()` - Disable Stripe auto-payouts
- `createPayoutToBankAccount()` - Create payout to specific account
- `getNextBankAccount()` - Select account using rotation strategy
- `calculateNextPayoutDate()` - Calculate next scheduled date

---

## ✅ Checklist for Production

- [ ] Set up cron job for automatic payout processing
- [ ] Configure Stripe webhooks for payout events
- [ ] Implement error handling and retry logic
- [ ] Add user notifications for payout status
- [ ] Set up monitoring and alerting
- [ ] Test all rotation strategies
- [ ] Verify Stripe auto-payouts are disabled
- [ ] Document minimum payout amounts
- [ ] Create admin dashboard for payout management
- [ ] Implement audit logging

---

**Implementation Complete!** 🎉

The payout schedule system provides full control over when and which bank account receives payouts, with automatic rotation support for businesses with multiple bank accounts.

