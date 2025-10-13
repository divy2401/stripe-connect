# ⚡ Quick Start Guide

Get up and running in **5 minutes**!

## 🎯 Prerequisites

- Node.js 18+
- Docker (optional, for easy PostgreSQL setup)
- Stripe Account (test mode)

## 🚀 Fast Setup

### 1. Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) (Test Mode)
2. Navigate to **Developers** → **API keys**
3. Copy:
   - Publishable key (`pk_test_...`)
   - Secret key (`sk_test_...`)

### 2. Start Database (with Docker)

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Wait 10 seconds for database to be ready
```

**Or** use your local PostgreSQL and create database: `stripe_connect_demo`

### 3. Backend Setup

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stripe_connect_demo?schema=public"
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
STRIPE_WEBHOOK_SECRET=""
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
EOF

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start server
npm run dev
```

### 4. Frontend Setup

Open **new terminal**:

```bash
cd frontend
npm install

# Create .env file
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
EOF

# Start frontend
npm run dev
```

### 5. Setup Stripe Webhooks

Open **new terminal**:

```bash
# Login (first time only)
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3001/webhook
```

Copy the webhook secret (`whsec_...`) and add to `backend/.env`:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Restart backend** (`Ctrl+C` and `npm run dev` in backend terminal).

## ✅ Test It

1. Open http://localhost:5173
2. Click **"Onboard New Business"**
3. Create a business
4. Click **"Make a Payment"**
5. Use test card: `4242 4242 4242 4242`
6. Watch webhooks in Stripe CLI terminal! 🎉

## 🆘 Need Help?

See [SETUP.md](./SETUP.md) for detailed instructions.

## 🛠️ Useful Commands

```bash
# Start everything (requires root package.json setup)
npm run dev

# Stop database
docker-compose down

# Reset database (WARNING: deletes all data)
docker-compose down -v && docker-compose up -d
cd backend && npm run prisma:migrate
```

## 📚 What's Next?

- Read [README.md](./README.md) for architecture overview
- Check [backend/README.md](./backend/README.md) for API docs
- Explore [frontend/README.md](./frontend/README.md) for UI details

---

**Happy coding!** 🚀
