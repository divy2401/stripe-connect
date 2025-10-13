# ✅ Setup & Verification Checklist

Use this interactive checklist to ensure your Stripe Connect demo is properly configured and running.

---

## 🎯 Pre-Setup Checklist

Before starting, make sure you have:

- [ ] **Node.js 18+** installed

  - Run: `node --version`
  - Should output: `v18.x.x` or higher

- [ ] **npm** installed

  - Run: `npm --version`
  - Should output: `9.x.x` or higher

- [ ] **PostgreSQL** installed and running

  - Run: `psql --version`
  - Or use Docker: `docker --version`

- [ ] **Stripe Account** created

  - Sign up at: https://dashboard.stripe.com/register
  - Switch to **Test Mode** (toggle in top-right)

- [ ] **Stripe CLI** installed
  - Download: https://stripe.com/docs/stripe-cli
  - Run: `stripe --version`

---

## 📋 Stripe Configuration Checklist

### Step 1: Get Stripe API Keys

- [ ] Logged into Stripe Dashboard
- [ ] In **Test Mode** (important!)
- [ ] Navigated to **Developers** → **API keys**
- [ ] Copied **Publishable key** (starts with `pk_test_`)
- [ ] Copied **Secret key** (starts with `sk_test_`)
- [ ] Stored keys securely (don't commit to Git!)

---

## 🗄️ Database Setup Checklist

### Option A: Docker (Recommended)

- [ ] Docker Desktop installed
- [ ] Navigated to project root
- [ ] Ran: `docker-compose up -d`
- [ ] Verified container running: `docker ps`
- [ ] See `stripe-connect-postgres` container

### Option B: Local PostgreSQL

- [ ] PostgreSQL server running
- [ ] Created database: `CREATE DATABASE stripe_connect_demo;`
- [ ] Noted connection URL format:
  ```
  postgresql://username:password@localhost:5432/stripe_connect_demo
  ```

---

## 🔧 Backend Setup Checklist

- [ ] Navigated to `backend/` directory
- [ ] Ran: `npm install`
- [ ] Installation completed successfully
- [ ] Created `.env` file in `backend/`
- [ ] Added `DATABASE_URL` to `.env`
- [ ] Added `STRIPE_SECRET_KEY` to `.env`
- [ ] Added `PORT=3001` to `.env`
- [ ] Added `FRONTEND_URL=http://localhost:5173` to `.env`
- [ ] Ran: `npm run prisma:generate`
- [ ] Ran: `npm run prisma:migrate`
- [ ] Migration completed successfully
- [ ] Started backend: `npm run dev`
- [ ] See message: `✅ Database connected`
- [ ] See message: `🚀 Backend server running on http://localhost:3001`
- [ ] Backend running without errors

---

## 🎨 Frontend Setup Checklist

- [ ] Opened **new terminal**
- [ ] Navigated to `frontend/` directory
- [ ] Ran: `npm install`
- [ ] Installation completed successfully
- [ ] Created `.env` file in `frontend/`
- [ ] Added `VITE_API_BASE_URL=http://localhost:3001` to `.env`
- [ ] Added `VITE_STRIPE_PUBLISHABLE_KEY` to `.env`
- [ ] Started frontend: `npm run dev`
- [ ] See message: `Local: http://localhost:5173/`
- [ ] Frontend running without errors
- [ ] Opened browser to http://localhost:5173
- [ ] Page loads successfully
- [ ] No console errors in browser

---

## 🔔 Webhook Setup Checklist

- [ ] Opened **third terminal**
- [ ] Ran: `stripe login` (first time only)
- [ ] Authorized Stripe CLI in browser
- [ ] Ran: `stripe listen --forward-to localhost:3001/webhook`
- [ ] See message: `Ready! Your webhook signing secret is whsec_...`
- [ ] Copied webhook signing secret (starts with `whsec_`)
- [ ] Added to `backend/.env`: `STRIPE_WEBHOOK_SECRET="whsec_..."`
- [ ] Restarted backend server (Ctrl+C then `npm run dev`)
- [ ] Webhook listener still running
- [ ] No errors in Stripe CLI terminal

---

## 🎉 Feature Testing Checklist

### Test 1: Business Onboarding

- [ ] Frontend home page loaded
- [ ] Clicked **"Onboard New Business"** button
- [ ] Filled in business name (e.g., "Test Business")
- [ ] Filled in business email (e.g., "test@example.com")
- [ ] Clicked **"Create Business"** button
- [ ] See success message
- [ ] Business shows Stripe Account ID (starts with `acct_`)
- [ ] Business status shown (active or pending)
- [ ] No errors in backend console
- [ ] No errors in frontend console

### Test 2: List Businesses

- [ ] Navigated back to home page
- [ ] Created business appears in list
- [ ] Business name displayed correctly
- [ ] Business email displayed correctly
- [ ] Status badge shown (green for active, yellow for pending)

### Test 3: Payment Processing

- [ ] Clicked **"Make a Payment"** or **"Pay"** button
- [ ] Payment page loaded
- [ ] Business dropdown populated
- [ ] Selected the test business
- [ ] Entered amount: `10.00`
- [ ] See platform fee: `$1.00`
- [ ] See business receives: `$9.00`
- [ ] Clicked **"Continue to Payment"**
- [ ] Stripe payment form appeared
- [ ] Entered card: `4242 4242 4242 4242`
- [ ] Entered expiry: `12/25` (any future date)
- [ ] Entered CVC: `123` (any 3 digits)
- [ ] Entered ZIP: `12345` (any 5 digits)
- [ ] Clicked **"Pay Now"**
- [ ] See loading state
- [ ] See success message: "Payment succeeded! 🎉"
- [ ] No errors in frontend console

### Test 4: Webhook Verification

- [ ] After payment, checked Stripe CLI terminal
- [ ] See webhook event: `payment_intent.created`
- [ ] See webhook event: `payment_intent.succeeded`
- [ ] See webhook event: `charge.succeeded`
- [ ] See webhook event: `transfer.created` or `transfer.paid`
- [ ] Checked backend console
- [ ] See log: `Received webhook event: payment_intent.succeeded`
- [ ] See log: `Updated payment xxx status to: succeeded`
- [ ] No error logs

### Test 5: Database Verification (Optional)

- [ ] Ran: `npm run prisma:studio` in backend directory
- [ ] Prisma Studio opened at http://localhost:5555
- [ ] See `businesses` table with created business
- [ ] See `payments` table with payment record
- [ ] Payment status is `succeeded`
- [ ] Platform fee recorded correctly

### Test 6: API Endpoints

- [ ] Backend accessible at http://localhost:3001
- [ ] Test GET businesses:
  ```bash
  curl http://localhost:3001/businesses
  ```
- [ ] Returns JSON array with businesses
- [ ] No 500 errors

---

## 🔍 Troubleshooting Checklist

If something isn't working, check these common issues:

### Backend Issues

- [ ] PostgreSQL is running
- [ ] `.env` file exists in `backend/` directory
- [ ] `DATABASE_URL` in `.env` is correct
- [ ] `STRIPE_SECRET_KEY` in `.env` is correct (starts with `sk_test_`)
- [ ] Port 3001 is not in use by another process
- [ ] Ran `npm run prisma:generate` after changing schema
- [ ] Ran `npm run prisma:migrate` to create tables

### Frontend Issues

- [ ] `.env` file exists in `frontend/` directory
- [ ] `VITE_API_BASE_URL` is set to `http://localhost:3001`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` is correct (starts with `pk_test_`)
- [ ] Port 5173 is not in use by another process
- [ ] Backend is running and accessible

### Webhook Issues

- [ ] Stripe CLI is running: `stripe listen --forward-to localhost:3001/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` in backend `.env` matches CLI output
- [ ] Backend was restarted after adding webhook secret
- [ ] Backend is accessible at http://localhost:3001

### Payment Issues

- [ ] Using test mode in Stripe Dashboard
- [ ] Using Stripe test card: `4242 4242 4242 4242`
- [ ] Business account status is `active` (may take 10-30 seconds)
- [ ] No console errors in browser
- [ ] Backend logs show no errors

---

## 🎓 Learning Checklist

To fully understand the project:

- [ ] Read [README.md](./README.md) - Overview and architecture
- [ ] Read [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical deep-dive
- [ ] Explored `backend/src/` directory structure
- [ ] Reviewed Prisma schema: `backend/prisma/schema.prisma`
- [ ] Examined API controllers in `backend/src/business/`
- [ ] Studied webhook handlers in `backend/src/webhook/`
- [ ] Explored `frontend/src/` directory structure
- [ ] Reviewed React components in `frontend/src/components/`
- [ ] Studied API client in `frontend/src/api/client.ts`
- [ ] Examined payment flow in `frontend/src/pages/PaymentPage.tsx`

---

## 🚀 Next Steps Checklist

After completing setup:

- [ ] Try different test cards (declined, insufficient funds)
- [ ] Create multiple businesses
- [ ] Test payments to different businesses
- [ ] Check business balance endpoint
- [ ] Review Stripe Dashboard → Payments
- [ ] Review Stripe Dashboard → Connect → Accounts
- [ ] Experiment with different amounts
- [ ] Review webhook events in Stripe CLI

---

## 📊 Performance Checklist

- [ ] Backend responds quickly (< 500ms)
- [ ] Frontend loads fast (< 2s)
- [ ] No memory leaks in browser console
- [ ] Database queries are efficient
- [ ] Webhook events processed quickly

---

## 🔒 Security Checklist

- [ ] Secret keys not committed to Git
- [ ] `.env` files in `.gitignore`
- [ ] Using environment variables for sensitive data
- [ ] Webhook signature verification enabled
- [ ] CORS configured properly
- [ ] Using HTTPS in production (when deployed)

---

## ✨ Production Readiness Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Database migrations reviewed
- [ ] Error handling comprehensive
- [ ] Logging configured
- [ ] Monitoring set up (Sentry, Datadog)
- [ ] Rate limiting implemented
- [ ] Authentication added
- [ ] API documentation created
- [ ] Backup strategy in place

---

## 🎯 Final Verification

All systems operational:

- [ ] ✅ Backend running on http://localhost:3001
- [ ] ✅ Frontend running on http://localhost:5173
- [ ] ✅ Database connected and accessible
- [ ] ✅ Stripe CLI forwarding webhooks
- [ ] ✅ Can create businesses successfully
- [ ] ✅ Can process payments successfully
- [ ] ✅ Webhooks received and processed
- [ ] ✅ No errors in any terminal

---

## 🎉 Congratulations!

If all items are checked, you have successfully:

✅ Set up a complete Stripe Connect platform  
✅ Integrated Custom Connected Accounts  
✅ Implemented Destination Charges  
✅ Configured webhook handling  
✅ Built a full-stack TypeScript application

**You're ready to learn from and extend this project!** 🚀

---

## 📞 Need Help?

- Check [SETUP.md](./SETUP.md) for detailed instructions
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Visit [Stripe Documentation](https://stripe.com/docs/connect)
- Join [Stripe Discord](https://discord.gg/stripe)

---

**Print this checklist and check off items as you go!** ✏️
