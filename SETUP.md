# 🚀 Complete Setup Guide - Stripe Connect Demo

Follow this step-by-step guide to get the Stripe Connect demo running on your local machine.

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org))
- [ ] **PostgreSQL** installed and running ([Download](https://www.postgresql.org/download/))
- [ ] **Stripe Account** (free test account) ([Sign up](https://dashboard.stripe.com/register))
- [ ] **Stripe CLI** installed ([Instructions](https://stripe.com/docs/stripe-cli))
- [ ] **Git** installed (optional, for cloning)

---

## 📦 Step 1: Get Your Stripe Keys

### 1.1 Get API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Navigate to **Developers** → **API keys**
4. Copy the following keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

**⚠️ Important:** Never commit secret keys to Git!

---

## 🗄️ Step 2: Setup PostgreSQL Database

### 2.1 Create Database

Open your PostgreSQL client (pgAdmin, psql, or any SQL client) and run:

```sql
CREATE DATABASE stripe_connect_demo;
```

### 2.2 Note Database Connection URL

Your connection URL should look like:

```
postgresql://username:password@localhost:5432/stripe_connect_demo
```

Example:

```
postgresql://postgres:postgres@localhost:5432/stripe_connect_demo
```

---

## 🔧 Step 3: Backend Setup

### 3.1 Navigate to Backend Directory

```bash
cd backend
```

### 3.2 Install Dependencies

```bash
npm install
```

This will install all required packages (~2-3 minutes).

### 3.3 Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
touch .env
```

Add the following content (replace with your actual values):

```env
# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stripe_connect_demo?schema=public"

# Stripe Keys
STRIPE_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
STRIPE_WEBHOOK_SECRET=""

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS - Frontend URL
FRONTEND_URL="http://localhost:5173"
```

**Note:** We'll fill in `STRIPE_WEBHOOK_SECRET` later after setting up Stripe CLI.

### 3.4 Setup Database with Prisma

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

### 3.5 Verify Database Setup (Optional)

Open Prisma Studio to view your database:

```bash
npm run prisma:studio
```

This opens a GUI at `http://localhost:5555` to view tables.

### 3.6 Start Backend Server

```bash
npm run dev
```

You should see:

```
✅ Database connected
🚀 Backend server running on http://localhost:3001
```

**Leave this terminal running** and open a new terminal for the next steps.

---

## 🎨 Step 4: Frontend Setup

### 4.1 Navigate to Frontend Directory

Open a **new terminal** and run:

```bash
cd frontend
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
touch .env
```

Add the following content:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual Stripe publishable key.

### 4.4 Start Frontend Development Server

```bash
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Leave this terminal running** as well.

---

## 🔔 Step 5: Setup Stripe CLI for Webhooks

Webhooks allow your backend to receive real-time events from Stripe (payment succeeded, account updated, etc.).

### 5.1 Login to Stripe CLI

Open a **third terminal** and run:

```bash
stripe login
```

This will open your browser to authorize the CLI.

### 5.2 Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3001/webhook
```

You should see output like:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxx
```

### 5.3 Copy Webhook Secret

Copy the webhook signing secret (starts with `whsec_...`).

### 5.4 Update Backend .env File

1. Go back to your `backend/.env` file
2. Update the `STRIPE_WEBHOOK_SECRET` line:

```env
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxx"
```

### 5.5 Restart Backend Server

1. Go to the terminal running your backend
2. Press `Ctrl+C` to stop it
3. Run `npm run dev` again

**Keep the Stripe CLI terminal running** to receive webhook events.

---

## 🎉 Step 6: Test the Application

You should now have **three terminals running**:

1. ✅ Backend server (`http://localhost:3001`)
2. ✅ Frontend server (`http://localhost:5173`)
3. ✅ Stripe CLI webhook forwarding

### 6.1 Open the Application

Open your browser and navigate to:

```
http://localhost:5173
```

### 6.2 Onboard a Business

1. Click **"Onboard New Business"**
2. Fill in the form:
   - **Name:** Test Business
   - **Email:** test@example.com
3. Click **"Create Business"**
4. You should see a success message with Stripe Account ID

### 6.3 Make a Test Payment

1. Click **"Make a Payment"** or **"Pay"** next to the business
2. Select the business you just created
3. Enter amount: `$10.00`
4. Click **"Continue to Payment"**
5. Enter test card details:
   - **Card:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., `12/25`)
   - **CVC:** Any 3 digits (e.g., `123`)
   - **ZIP:** Any 5 digits (e.g., `12345`)
6. Click **"Pay Now"**

### 6.4 Verify Payment Success

**In the Frontend:**

- You should see "Payment succeeded! 🎉"

**In the Stripe CLI Terminal:**

- You should see webhook events logged:
  ```
  payment_intent.succeeded [evt_xxxxx]
  transfer.created [evt_xxxxx]
  ```

**In the Backend Terminal:**

- You should see logs like:
  ```
  Received webhook event: payment_intent.succeeded
  Updated payment xxx status to: succeeded
  ```

**In Stripe Dashboard:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/payments)
2. You should see the payment in **Payments** section
3. Check **Connect** → **Accounts** to see the connected account

---

## 🔍 Step 7: Explore Features

### View Business Balance

1. On the home page, find your business
2. The balance endpoint is available at:
   ```
   GET http://localhost:3001/businesses/{business-id}/balance
   ```

### View All Businesses

Home page automatically displays all connected businesses.

### Test Different Card Scenarios

Try these test cards to see different behaviors:

| Card Number         | Scenario           |
| ------------------- | ------------------ |
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined      |
| 4000 0000 0000 9995 | Insufficient funds |

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `DATABASE_URL is not defined`

- **Solution:** Make sure `.env` file exists in `backend/` directory

**Error:** `Database connection failed`

- **Solution:** Ensure PostgreSQL is running and credentials are correct

**Error:** `STRIPE_SECRET_KEY is not defined`

- **Solution:** Add your Stripe secret key to `backend/.env`

### Frontend won't start

**Error:** Missing dependencies

- **Solution:** Run `npm install` in `frontend/` directory

**Error:** API requests failing

- **Solution:** Ensure backend is running on `http://localhost:3001`

### Webhooks not working

**Error:** Webhook signature verification failed

- **Solution:** Make sure `STRIPE_WEBHOOK_SECRET` in `.env` matches the one from `stripe listen`

**Error:** No webhook events received

- **Solution:** Ensure Stripe CLI is running with `stripe listen --forward-to localhost:3001/webhook`

### Payment fails

**Error:** Business account not active

- **Solution:** Custom accounts may take a moment to activate. Wait 10-30 seconds and try again.

**Error:** Invalid publishable key

- **Solution:** Ensure `VITE_STRIPE_PUBLISHABLE_KEY` in `frontend/.env` is correct

---

## 📚 Next Steps

✅ **You're all set!** Here are some ideas to extend this project:

1. **Add authentication** - Implement user login for businesses
2. **Add business dashboard** - Show payment history, analytics
3. **Implement refunds** - Add refund functionality via Stripe API
4. **Add Express accounts** - Try Standard or Express connected accounts
5. **Deploy to production** - Deploy to Heroku, AWS, or Vercel

---

## 🔗 Useful Links

- 📖 [Full README](./README.md)
- 🔧 [Backend README](./backend/README.md)
- 🎨 [Frontend README](./frontend/README.md)
- 📘 [Stripe Connect Docs](https://stripe.com/docs/connect)
- 💬 [Stripe Discord](https://discord.gg/stripe)

---

## ✨ Summary

You now have a fully functional Stripe Connect demo with:

- ✅ Custom Connected Accounts
- ✅ Destination Charges
- ✅ Webhook handling
- ✅ Payment processing
- ✅ Beautiful React UI
- ✅ Type-safe backend

**Happy coding!** 🚀
