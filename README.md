# Stripe Connect Demo - Custom Connected Accounts

A full-stack demonstration of **Stripe Connect with Custom Connected Accounts** featuring both **destination charges** and **direct charges**, plus **dual verification methods**: custom in-house verification and Stripe's embedded onboarding. This project showcases how a platform can automatically create connected accounts for businesses, handle flexible KYC verification, and process payments with platform fees.

## 🏗️ Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────────┐
│  Customer   │──────▶│   Platform   │──────▶│  Connected Acct │
│             │       │  (Your App)  │       │   (Business)    │
└─────────────┘       └──────────────┘       └─────────────────┘
                             │
                             │ 10% Platform Fee
                             ▼
                      ┌──────────────┐
                      │    Stripe    │
                      └──────────────┘
```

### Payment Flows

#### **Destination Charges**

1. **Customer** initiates payment for a business
2. **Platform** collects the full payment amount
3. **Platform** deducts 10% application fee
4. **Stripe** automatically transfers remaining 90% to the connected account
5. **Webhooks** confirm successful payment and transfer

#### **Direct Charges**

1. **Customer** initiates payment for a business
2. **Payment** goes directly to the connected account
3. **Platform** takes application fee from the payment
4. **Webhooks** confirm successful payment

### **Dual Verification Methods**

#### **Custom Form Verification**

1. **Business** created with basic information
2. **Platform** collects KYC data through custom forms
3. **Backend** submits verification data to Stripe
4. **Stripe** reviews and updates account status
5. **Webhooks** sync verification status in real-time

#### **Embedded Onboarding Verification**

1. **Business** created with basic information
2. **Platform** creates Stripe Account Session
3. **Stripe** embedded form collects verification data
4. **Stripe** processes verification automatically
5. **Webhooks** sync verification status in real-time

## 🛠️ Tech Stack

### Backend

- **NestJS** - Progressive Node.js framework
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Database
- **Stripe Node SDK** - Payment processing
- **TypeScript** - Type safety

### Frontend

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **TanStack Query (React Query)** - Data fetching
- **Stripe Elements** - Secure payment UI
- **Tailwind CSS** - Styling

## 📦 Project Structure

```
stripe-connect-demo/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── business/              # Business module (CRUD + Stripe account creation)
│   │   ├── payment/               # Payment module (Payment intents)
│   │   ├── webhook/               # Webhook handlers
│   │   ├── stripe/                # Stripe service wrapper
│   │   ├── prisma/                # Prisma service
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                   # API client
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── config.ts              # Configuration
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── .env.example
└── README.md
```

## ✨ Key Features

### **🔐 Dual Verification Methods**

#### **Custom Form Verification**

- **In-house KYC forms** - No redirect to Stripe hosted pages
- **Multi-step verification** - Business info, representative details, bank account
- **Full control** - Custom UI/UX and data collection flow
- **Status management** - PENDING → IN_REVIEW → VERIFIED/REJECTED

#### **Embedded Onboarding Verification**

- **Stripe embedded forms** - Secure, Stripe-managed verification
- **Automatic compliance** - Built-in regulatory compliance
- **Faster verification** - Streamlined Stripe-hosted process
- **Real-time status tracking** - Live updates via webhooks

### **💳 Dual Payment Methods**

- **Destination Charges** - Platform collects, then transfers
- **Direct Charges** - Payment goes directly to connected account
- **Platform fees** - Automatic 10% fee calculation
- **Stripe Elements** - Secure payment UI

### **🔄 Real-time Updates**

- **Webhook integration** - Account updates, payment success, transfers
- **Status synchronization** - Database stays in sync with Stripe
- **Live polling** - Frontend auto-refreshes verification status

### **🛡️ Production Ready**

- **Type safety** - Full TypeScript implementation
- **Error handling** - Comprehensive error management
- **Security** - Encrypted data transmission, masked sensitive info
- **Scalable** - Modular architecture, clean separation of concerns

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database
- **Stripe Account** (test mode)
- **Stripe CLI** (for webhook testing)

### 1. Clone and Setup

```bash
cd stripe-connect-demo
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Configure Environment Variables:**

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/stripe_connect_demo?schema=public"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Application
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

**Set up the Database:**

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

**Start the Backend:**

```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

**Note:** The frontend now includes Stripe Connect JS dependencies for embedded onboarding:

- `@stripe/react-connect-js` - React components for Stripe Connect
- `@stripe/connect-js` - Core Stripe Connect JavaScript SDK

**Configure Environment Variables:**

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Start the Frontend:**

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Stripe CLI Setup (for Webhooks)

Install Stripe CLI: https://stripe.com/docs/stripe-cli

**Login to Stripe:**

```bash
stripe login
```

**Forward webhooks to your local server:**

```bash
stripe listen --forward-to localhost:3001/webhook
```

This will output a webhook signing secret (e.g., `whsec_...`). Copy this value and update your backend `.env` file:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Restart the backend** after updating the webhook secret.

## 📡 API Endpoints

### Business Management

| Method | Endpoint                  | Description                      |
| ------ | ------------------------- | -------------------------------- |
| POST   | `/businesses`             | Create business + Stripe account |
| GET    | `/businesses`             | Get all businesses               |
| GET    | `/businesses/:id`         | Get business by ID               |
| GET    | `/businesses/:id/balance` | Get business Stripe balance      |

### Payment Processing

| Method | Endpoint                         | Description                         |
| ------ | -------------------------------- | ----------------------------------- |
| POST   | `/payment/create-payment-intent` | Create payment intent (destination) |

### Webhooks

| Method | Endpoint   | Description                  |
| ------ | ---------- | ---------------------------- |
| POST   | `/webhook` | Handle Stripe webhook events |

**Webhook Events Handled:**

- `account.updated` - Updates business account status
- `payment_intent.succeeded` - Marks payment as succeeded
- `payment_intent.payment_failed` - Marks payment as failed
- `transfer.created` - Logs transfer creation

## 💡 How to Use

### 1. Onboard a Business

1. Navigate to **Onboard Business** page
2. Enter business name and email
3. Submit form
4. Platform automatically creates:
   - Database record
   - Stripe Custom Connected Account
5. Business status: **PENDING** verification

### 2. Verify Business Account

1. On home page, click **"Verify Account"** for a business
2. **Choose verification method:**

   **Option A: Custom Form**
   - Complete 3-step verification form:
     - **Step 1:** Business information (name, type, tax ID)
     - **Step 2:** Representative details (personal info, address)
     - **Step 3:** Bank account information
   - Submit verification
   - Status changes to **IN_REVIEW**

   **Option B: Stripe Embedded Onboarding**
   - Click "Stripe Embedded Onboarding"
   - Complete verification in Stripe's secure embedded form
   - Automatic status updates via webhooks
   - Status changes to **IN_REVIEW** → **VERIFIED**

3. Stripe reviews the information (usually 1-2 business days)

### 3. Monitor Verification Status

1. Click **"Check Status"** or **"View Details"** on business card
2. View real-time verification status:
   - **PENDING:** Needs verification
   - **IN_REVIEW:** Under Stripe review
   - **VERIFIED:** Ready for payments
   - **REJECTED:** Needs resubmission
3. Page auto-refreshes every 5 seconds

### 4. Make a Payment

1. Navigate to **Make Payment** page
2. Select a **VERIFIED** business from dropdown
3. Choose payment method:
   - **💳 Destination Charge** - Platform collects, then transfers
   - **⚡ Direct Charge** - Direct to connected account
4. Enter payment amount
5. Complete payment with test card: `4242 4242 4242 4242`
6. Check webhook logs for confirmation

### 5. View Business Balance

1. Go to home page
2. Click **"View Details"** on a business
3. View available and pending balance

## 🧪 Testing

### Test Cards (Stripe Test Mode)

| Card Number         | Description        |
| ------------------- | ------------------ |
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Declined card      |
| 4000 0000 0000 9995 | Insufficient funds |

Use any future expiry date and any 3-digit CVC.

### Testing Webhooks

1. Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3001/webhook`
2. Make a payment through the UI
3. Watch the webhook logs in:
   - Stripe CLI terminal
   - Backend console logs

## 🔐 Security Notes

This is a **demo project** for learning purposes. For production:

1. ✅ Use environment variables (already implemented)
2. ⚠️ Implement proper authentication/authorization
3. ⚠️ Add rate limiting
4. ⚠️ Validate webhook signatures (already implemented)
5. ⚠️ Use proper error handling
6. ⚠️ Add logging and monitoring
7. ⚠️ Implement proper account verification flow
8. ⚠️ Handle edge cases (refunds, disputes, etc.)

## 📚 Key Concepts

### Custom Connected Accounts

- **Platform-controlled** - You create and manage accounts on behalf of businesses
- **No redirect** - Businesses don't need existing Stripe accounts
- **Full control** - Platform handles compliance, verification, payouts

### Destination Charges

- **Platform collects** - Payment goes to platform first
- **Automatic transfer** - Stripe transfers to connected account minus platform fee
- **Simple fee structure** - Application fee deducted at payment time

### Why This Approach?

- ✅ Simple onboarding (no redirect flow)
- ✅ Platform controls experience
- ✅ Automatic fee collection
- ✅ Transparent payment flow
- ✅ Suitable for marketplace/SaaS platforms

## 🎯 Features Implemented

- [x] Custom Connected Account creation via API
- [x] Destination charges with platform fees
- [x] Webhook handling for real-time updates
- [x] Business balance retrieval
- [x] Payment intent creation
- [x] Stripe Elements integration
- [x] React Query for data management
- [x] Type-safe API with TypeScript
- [x] Prisma ORM for database
- [x] Modern UI with Tailwind CSS

## 📖 Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Custom Accounts Guide](https://stripe.com/docs/connect/custom-accounts)
- [Destination Charges](https://stripe.com/docs/connect/destination-charges)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

## 🤝 Contributing

This is a demo project. Feel free to fork and extend for your own learning!

## 📝 License

MIT License - feel free to use for learning and commercial projects.

---

**Built with ❤️ for learning Stripe Connect**
