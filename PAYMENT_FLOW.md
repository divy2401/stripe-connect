# 💳 Payment Flow Visualization

This document illustrates how money flows through the Stripe Connect platform using Destination Charges.

---

## 🎯 Overview: Destination Charges

With Destination Charges, the **platform collects payment first**, then Stripe automatically transfers funds to the connected account minus the platform fee.

---

## 💰 Money Flow Diagram

### Example: Customer Pays $100

```
┌─────────────────────────────────────────────────────────────────┐
│                      PAYMENT FLOW                               │
└─────────────────────────────────────────────────────────────────┘

Step 1: Customer Initiates Payment
┌──────────┐
│ Customer │ ──── Pays $100 for a product/service
└──────────┘

Step 2: Payment Goes to Platform
         │
         ▼
   ┌──────────┐
   │ Platform │ ──── Collects full $100
   │ (Stripe) │
   └──────────┘
         │
         │ Stripe processes payment
         ▼

Step 3: Platform Fee Deduction
   ┌──────────┐
   │ Platform │ ──── Keeps $10 (10% application fee)
   │ (You)    │
   └──────────┘
         │
         │ Automatic transfer
         ▼

Step 4: Business Receives Funds
   ┌──────────┐
   │ Business │ ──── Receives $90 (90% of payment)
   │ (Connect │
   │ Account) │
   └──────────┘
```

---

## 📊 Payment Distribution

| Party        | Amount | Percentage | Description             |
| ------------ | ------ | ---------- | ----------------------- |
| **Customer** | -$100  | 100%       | Pays total amount       |
| **Platform** | +$10   | 10%        | Application fee         |
| **Business** | +$90   | 90%        | Payment minus fee       |
| **Stripe**   | ~$3    | ~3%        | Stripe processing fee\* |

\*Stripe fees come from the business's portion (standard Stripe pricing applies)

---

## 🔄 Technical Flow

### 1. Payment Intent Creation

```typescript
// Backend creates PaymentIntent with destination
stripe.paymentIntents.create({
  amount: 10000, // $100.00 in cents
  currency: "usd",
  transfer_data: {
    destination: "acct_xxx", // Business's Stripe account
  },
  application_fee_amount: 1000, // $10.00 platform fee
});
```

### 2. Customer Completes Payment

```
Frontend (Stripe Elements)
         │
         │ Collects card info
         │
         ▼
    Stripe.js confirms payment
         │
         ▼
   Payment succeeds
```

### 3. Stripe Processes Transfer

```
Stripe Platform
         │
         ├──▶ Holds $10 for platform
         │
         └──▶ Transfers $90 to acct_xxx
```

### 4. Webhooks Notify Backend

```
payment_intent.succeeded ──▶ Update payment status
transfer.created         ──▶ Log transfer initiated
transfer.paid           ──▶ Confirm funds transferred
```

---

## 🎬 Step-by-Step Example

Let's walk through a real payment:

### Scenario

- **Business:** "Coffee Shop"
- **Product:** Premium coffee beans
- **Price:** $50.00
- **Platform Fee:** 10% ($5.00)
- **Business Receives:** $45.00

### Flow

```
1️⃣ Customer visits frontend
   └─▶ Selects "Coffee Shop"
   └─▶ Adds $50.00 product to cart

2️⃣ Customer clicks "Checkout"
   └─▶ Frontend calls: POST /payment/create-payment-intent
   └─▶ Backend calculates:
       • Total: $50.00
       • Platform fee: $5.00 (10%)
       • Business gets: $45.00

3️⃣ Backend creates PaymentIntent
   └─▶ Calls Stripe API with:
       {
         amount: 5000,
         destination: "acct_CoffeeShop123",
         application_fee_amount: 500
       }
   └─▶ Returns client_secret to frontend

4️⃣ Frontend displays Stripe Elements
   └─▶ Customer enters: 4242 4242 4242 4242
   └─▶ Stripe.js tokenizes card securely

5️⃣ Payment confirmed
   └─▶ Stripe charges customer's card: $50.00
   └─▶ Webhook: payment_intent.succeeded

6️⃣ Stripe processes transfer
   └─▶ Platform balance: +$5.00
   └─▶ Coffee Shop balance: +$45.00
   └─▶ Webhook: transfer.paid

7️⃣ Backend updates database
   └─▶ Payment status: "succeeded"
   └─▶ Transfer recorded

8️⃣ ✅ Complete!
   └─▶ Customer has product
   └─▶ Platform earned $5
   └─▶ Business earned $45
```

---

## 🧮 Fee Calculation

The platform fee is calculated in `backend/src/payment/payment.service.ts`:

```typescript
// Calculate platform fee (10% of amount)
const platformFeeAmount = Math.floor(amount * 0.1);

// Example calculations:
// $10.00 → $1.00 fee → Business gets $9.00
// $50.00 → $5.00 fee → Business gets $45.00
// $100.00 → $10.00 fee → Business gets $90.00
// $1,000.00 → $100.00 fee → Business gets $900.00
```

---

## 🔍 Database Records

After a successful payment, the database contains:

### Business Table

```sql
id: uuid
name: "Coffee Shop"
email: "shop@coffee.com"
stripe_account_id: "acct_CoffeeShop123"
stripe_account_status: "active"
```

### Payment Table

```sql
id: uuid
business_id: [Coffee Shop UUID]
stripe_payment_intent: "pi_xxx"
amount: 5000 (cents)
currency: "usd"
status: "succeeded"
platform_fee: 500 (cents)
```

---

## 🎯 Destination Charges vs. Direct Charges

### ✅ Destination Charges (This Project)

```
Customer → Platform → Business
           (Platform deducts fee first)
```

**Pros:**

- ✅ Platform collects payment first
- ✅ Automatic fee deduction
- ✅ Better fraud protection for platform
- ✅ Simpler reconciliation
- ✅ Platform has more control

**Cons:**

- ❌ Platform responsible if issues occur
- ❌ Higher compliance requirements

### ❌ Direct Charges (Alternative)

```
Customer → Business
           (Platform invoices separately for fees)
```

**Pros:**

- ✅ Business has more control
- ✅ Lower platform compliance burden

**Cons:**

- ❌ Platform must invoice separately
- ❌ More complex reconciliation
- ❌ Harder to collect fees

---

## 🔔 Webhook Events Timeline

```
Time: 0s
├─▶ payment_intent.created
│   └─ Payment Intent created
│
Time: 2s
├─▶ charge.succeeded
│   └─ Card charged successfully
│
Time: 2.1s
├─▶ payment_intent.succeeded
│   └─ Payment confirmed
│   └─ Backend updates payment status
│
Time: 3s
├─▶ transfer.created
│   └─ Transfer to business initiated
│
Time: 5s
└─▶ transfer.paid
    └─ Business received funds
    └─ Backend logs transfer
```

---

## 💡 Customizing Platform Fee

You can adjust the platform fee in `backend/src/payment/payment.service.ts`:

```typescript
// Current: 10% fee
const platformFeeAmount = Math.floor(amount * 0.1);

// Example: 5% fee
const platformFeeAmount = Math.floor(amount * 0.05);

// Example: Fixed $2 fee
const platformFeeAmount = 200; // in cents

// Example: Tiered fees
const platformFeeAmount =
  amount < 10000
    ? Math.floor(amount * 0.15) // 15% for amounts < $100
    : Math.floor(amount * 0.1); // 10% for amounts >= $100
```

---

## 🔐 Security Considerations

### Payment Security

- ✅ Card data never touches your server
- ✅ Stripe Elements handles tokenization
- ✅ PCI DSS compliant by default
- ✅ HTTPS required in production

### Webhook Security

- ✅ Signature verification prevents tampering
- ✅ Only process verified events
- ✅ Log all webhook events
- ✅ Idempotency prevents duplicate processing

---

## 📈 Scaling Considerations

### When to Use Destination Charges

✅ **Good for:**

- Marketplaces with many sellers
- Platforms with standardized fees
- B2B SaaS with payment processing
- Rental/booking platforms
- Service marketplaces

❌ **Not ideal for:**

- Direct peer-to-peer payments
- Platforms with complex fee structures
- When business needs full control
- Very high transaction volumes (consider Separate Charges)

---

## 🎓 Key Takeaways

1. **Platform collects first** - You have control over the payment
2. **Automatic transfers** - Stripe handles the transfer to business
3. **Transparent fees** - Everyone knows the fee structure
4. **Webhook-driven** - Real-time updates via webhooks
5. **Type-safe** - TypeScript ensures correct amounts
6. **Configurable** - Easy to adjust fee percentages

---

## 🧪 Testing the Flow

Try these test scenarios:

### Scenario 1: Successful Payment

```
Business: Test Shop
Amount: $50.00
Card: 4242 4242 4242 4242
Result: ✅ Success
Platform Fee: $5.00
Business Gets: $45.00
```

### Scenario 2: Declined Card

```
Business: Test Shop
Amount: $50.00
Card: 4000 0000 0000 0002
Result: ❌ Declined
Platform Fee: $0 (no charge)
Business Gets: $0
```

### Scenario 3: Large Payment

```
Business: Premium Store
Amount: $1,000.00
Card: 4242 4242 4242 4242
Result: ✅ Success
Platform Fee: $100.00
Business Gets: $900.00
```

---

## 📞 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [README.md](./README.md) - Project overview
- [Stripe Destination Charges](https://stripe.com/docs/connect/destination-charges)

---

**Now you understand exactly how money flows through your platform!** 💰

_This is the power of Stripe Connect with Destination Charges._
