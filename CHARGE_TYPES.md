# 💳 Charge Types: Direct vs Destination

This guide explains the differences between **Direct Charges** and **Destination Charges** in Stripe Connect, and how they're implemented in this project.

---

## 🎯 Overview

The application now supports **BOTH** payment methods:

1. **Destination Charges** - Platform collects payment, then transfers to business
2. **Direct Charges** - Payment goes directly to business, platform charges fee separately

---

## 💳 Destination Charges

### How It Works

```
Customer ($100)
     │
     ▼
Platform (Stripe)
     │
     ├─▶ Platform Fee: $10 (10%)
     │
     └─▶ Business: $90 (automatic transfer)
```

### Characteristics

✅ **Pros:**

- Platform collects payment first
- Automatic fee deduction
- Better fraud protection for platform
- Platform has full control over funds
- Simpler reconciliation
- Better for high-risk transactions

❌ **Cons:**

- Platform liable for chargebacks
- Higher compliance requirements
- Platform needs to maintain balance
- Business has less control

### Technical Implementation

**Backend (Stripe API):**

```typescript
stripe.paymentIntents.create({
  amount: 10000,
  currency: "usd",
  transfer_data: {
    destination: "acct_business123", // Business account
  },
  application_fee_amount: 1000, // Platform fee
});
```

**Key Fields:**

- `transfer_data.destination` - Connected account to transfer to
- `application_fee_amount` - Platform fee (deducted before transfer)

### Use Cases

✅ **Best For:**

- Marketplaces with many sellers
- High-risk industries
- When platform needs fraud protection
- When platform controls refunds
- When platform handles disputes

---

## ⚡ Direct Charges

### How It Works

```
Customer ($100)
     │
     ▼
Business Account (Stripe)
     │
     ├─▶ Business: $100 (receives full amount)
     │
     └─▶ Platform Fee: $10 (charged separately)
```

### Characteristics

✅ **Pros:**

- Payment goes directly to business
- Business receives funds immediately
- Faster fund availability
- Business has more control
- Lower platform compliance burden
- Better for established businesses

❌ **Cons:**

- Platform must invoice/charge fee separately
- More complex reconciliation
- Business liable for disputes
- Harder to enforce platform fees
- Requires business to have sufficient balance for fees

### Technical Implementation

**Backend (Stripe API):**

```typescript
stripe.paymentIntents.create(
  {
    amount: 10000,
    currency: "usd",
    application_fee_amount: 1000, // Platform fee
    on_behalf_of: "acct_business123", // Business account
  },
  {
    stripeAccount: "acct_business123", // Charge directly to business
  }
);
```

**Key Fields:**

- `stripeAccount` - Connected account to charge
- `on_behalf_of` - Business account
- `application_fee_amount` - Platform fee (charged to business)

### Use Cases

✅ **Best For:**

- B2B platforms
- Professional services
- When business needs immediate funds
- When business handles own disputes
- Lower-risk transactions

---

## 📊 Comparison Table

| Feature                  | Destination Charges | Direct Charges    |
| ------------------------ | ------------------- | ----------------- |
| **Payment Flow**         | Platform → Business | Direct → Business |
| **Fee Deduction**        | Automatic           | Separate charge   |
| **Fund Control**         | Platform            | Business          |
| **Chargeback Liability** | Platform            | Business          |
| **Fraud Protection**     | Platform            | Business          |
| **Fund Availability**    | Delayed             | Immediate         |
| **Reconciliation**       | Simple              | Complex           |
| **Compliance Burden**    | Higher (Platform)   | Lower (Platform)  |
| **Business Trust**       | Lower required      | Higher required   |
| **Fee Collection**       | Guaranteed          | Requires balance  |

---

## 🔄 How to Use in This Project

### Frontend - Choosing Charge Type

When making a payment, you'll see two buttons:

**1. 💳 Destination Charge (Blue Button)**

- Platform collects, then transfers
- Automatic fee handling
- Better fraud protection

**2. ⚡ Direct Charge (Purple Button)**

- Direct to connected account
- Business has more control
- Faster fund availability

### Backend - API Endpoints

**Option 1: Generic Endpoint (specify charge type)**

```bash
POST /payment/create-payment-intent
{
  "businessId": "uuid",
  "amount": 10000,
  "currency": "usd",
  "chargeType": "destination" | "direct"
}
```

**Option 2: Specific Endpoints**

```bash
# Destination Charge
POST /payment/create-destination-charge
{
  "businessId": "uuid",
  "amount": 10000,
  "currency": "usd"
}

# Direct Charge
POST /payment/create-direct-charge
{
  "businessId": "uuid",
  "amount": 10000,
  "currency": "usd"
}
```

---

## 💰 Fee Calculation

Both charge types use the same fee structure:

**Platform Fee:** 10% of transaction amount

```typescript
const platformFeeAmount = Math.floor(amount * 0.1);
```

**Example:**

- Customer pays: $100.00
- Platform fee: $10.00 (10%)
- Business receives: $90.00

**Customizing Fees:**

Edit `backend/src/payment/payment.service.ts`:

```typescript
// Change from 10% to 5%
const platformFeeAmount = Math.floor(dto.amount * 0.05);

// Or use a fixed fee
const platformFeeAmount = 200; // $2.00 fixed fee

// Or tiered fees
const platformFeeAmount =
  dto.amount < 10000
    ? Math.floor(dto.amount * 0.15) // 15% for < $100
    : Math.floor(dto.amount * 0.1); // 10% for >= $100
```

---

## 🧪 Testing Both Charge Types

### Test Scenario 1: Destination Charge

1. Go to Payment Page
2. Select a business
3. Enter amount: $50.00
4. Click **"💳 Destination Charge"**
5. Complete payment with test card: `4242 4242 4242 4242`
6. Verify:
   - Platform collected payment
   - Platform fee: $5.00
   - Business receives: $45.00 (automatic transfer)

### Test Scenario 2: Direct Charge

1. Go to Payment Page
2. Select a business
3. Enter amount: $50.00
4. Click **"⚡ Direct Charge"**
5. Complete payment with test card: `4242 4242 4242 4242`
6. Verify:
   - Business received payment directly
   - Platform fee: $5.00 (charged separately)
   - Business balance: $50.00

---

## 📝 Database Records

Both charge types store the same information:

```sql
payments (
  id: uuid
  business_id: uuid
  stripe_payment_intent: string
  amount: integer (cents)
  currency: string
  status: string
  platform_fee: integer (cents)
  created_at: timestamp
  updated_at: timestamp
)
```

The charge type is stored in the `metadata` field of the Stripe Payment Intent.

---

## 🔔 Webhook Events

### Destination Charges

```
1. payment_intent.created
2. charge.succeeded
3. payment_intent.succeeded
4. transfer.created ← Transfer to business initiated
```

### Direct Charges

```
1. payment_intent.created
2. charge.succeeded
3. payment_intent.succeeded
4. application_fee.created ← Platform fee charged
```

---

## 🎯 When to Use Which?

### Use Destination Charges When:

- ✅ You're building a marketplace with many sellers
- ✅ You need fraud protection
- ✅ You want automatic fee collection
- ✅ You handle refunds/disputes centrally
- ✅ You need full control over funds
- ✅ Sellers are low-trust or unverified

### Use Direct Charges When:

- ✅ You're building a B2B platform
- ✅ Sellers are established businesses
- ✅ Sellers need immediate fund access
- ✅ Sellers handle their own disputes
- ✅ You want lower compliance burden
- ✅ You trust sellers to maintain balance for fees

---

## 🔐 Security Considerations

### Destination Charges

- ✅ Platform controls all funds
- ✅ Better fraud detection
- ⚠️ Platform liable for chargebacks
- ⚠️ Platform needs proper compliance

### Direct Charges

- ✅ Business liable for chargebacks
- ✅ Lower platform compliance burden
- ⚠️ Business must maintain balance
- ⚠️ Harder to enforce fees if business balance is low

---

## 📚 Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Destination Charges Guide](https://stripe.com/docs/connect/destination-charges)
- [Direct Charges Guide](https://stripe.com/docs/connect/direct-charges)
- [Platform Fees](https://stripe.com/docs/connect/charges#application-fees)
- [Connect Account Types](https://stripe.com/docs/connect/accounts)

---

## 🎓 Key Takeaways

1. **Destination Charges** = Platform controls → Better for marketplaces
2. **Direct Charges** = Business controls → Better for B2B platforms
3. Both support platform fees (10% in this demo)
4. Both are implemented in the same codebase
5. Choice depends on your business model and risk tolerance
6. You can offer both options to your users

---

**Now you have the flexibility to choose the right charge type for your use case!** 🚀

_Last Updated: October 2025_
