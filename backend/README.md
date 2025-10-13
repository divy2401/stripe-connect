# Stripe Connect Backend (NestJS)

NestJS backend for Stripe Connect Custom Connected Accounts demo.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
```

## 📝 Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/stripe_connect_demo?schema=public"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

## 🗄️ Database Schema

### Business Table

```prisma
model Business {
  id                    String   @id @default(uuid())
  name                  String
  email                 String   @unique
  stripeAccountId       String   @unique
  stripeAccountStatus   String   @default("pending")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### Payment Table

```prisma
model Payment {
  id                  String   @id @default(uuid())
  businessId          String
  stripePaymentIntent String   @unique
  amount              Int
  currency            String   @default("usd")
  status              String
  platformFee         Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

## 🛠️ Commands

```bash
# Development
npm run dev           # Start with hot reload
npm run start         # Start without hot reload

# Build
npm run build         # Build for production
npm run start:prod    # Start production build

# Prisma
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio GUI

# Code Quality
npm run format        # Format code with Prettier
```

## 📡 API Endpoints

### Create Business

```http
POST /businesses
Content-Type: application/json

{
  "name": "Acme Corporation",
  "email": "contact@acme.com"
}
```

### Get All Businesses

```http
GET /businesses
```

### Get Business Balance

```http
GET /businesses/:id/balance
```

### Create Payment Intent

```http
POST /payment/create-payment-intent
Content-Type: application/json

{
  "businessId": "uuid",
  "amount": 5000,
  "currency": "usd"
}
```

### Webhook Endpoint

```http
POST /webhook
Stripe-Signature: signature_header

[Stripe webhook payload]
```

## 🏗️ Module Structure

```
src/
├── business/           # Business CRUD + Stripe account creation
│   ├── business.controller.ts
│   ├── business.service.ts
│   ├── business.module.ts
│   └── dto/
├── payment/            # Payment intent creation
│   ├── payment.controller.ts
│   ├── payment.service.ts
│   ├── payment.module.ts
│   └── dto/
├── webhook/            # Stripe webhook handlers
│   ├── webhook.controller.ts
│   ├── webhook.service.ts
│   └── webhook.module.ts
├── stripe/             # Stripe service wrapper
│   ├── stripe.service.ts
│   └── stripe.module.ts
├── prisma/             # Database service
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.module.ts
└── main.ts
```

## 🔔 Webhook Events

The following Stripe webhook events are handled:

- `account.updated` - Updates business account status
- `payment_intent.succeeded` - Marks payment as succeeded
- `payment_intent.payment_failed` - Marks payment as failed
- `transfer.paid` - Logs successful transfers

## 🧪 Testing with Stripe CLI

```bash
# Listen to webhooks
stripe listen --forward-to localhost:3001/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger account.updated
```

## 🔐 Security Features

- ✅ CORS enabled for frontend
- ✅ Webhook signature verification
- ✅ Input validation with class-validator
- ✅ Environment variable validation
- ✅ Error handling middleware

## 📦 Dependencies

**Core:**

- `@nestjs/core` - NestJS framework
- `@nestjs/platform-express` - HTTP server
- `@prisma/client` - Database client
- `stripe` - Stripe SDK (v19.x with API v2025-09-30.clover)

**Configuration:**

- `@nestjs/config` - Environment variables

**Validation:**

- `class-validator` - DTO validation
- `class-transformer` - Object transformation

## 🐳 Docker Support (Optional)

Add `docker-compose.yml` for PostgreSQL:

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: stripe_connect_demo
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with: `docker-compose up -d`

## 📝 Notes

- Platform fee is set to 10% (configurable in `payment.service.ts`)
- Minimum payment amount: $0.50 (50 cents)
- Currency: USD (configurable)
- Country: US (for Custom accounts)
