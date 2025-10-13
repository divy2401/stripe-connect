# 🏗️ Architecture Documentation

## System Overview

This is a **marketplace platform** built using Stripe Connect with Custom Connected Accounts and Destination Charges.

```
┌──────────────────────────────────────────────────────────────┐
│                      Platform Architecture                     │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Customer  │────────▶│   Platform   │────────▶│   Business   │
│             │         │   (Our App)  │         │  (Connected  │
│             │         │              │         │   Account)   │
└─────────────┘         └──────────────┘         └──────────────┘
                               │
                               │ 10% Fee
                               ▼
                        ┌──────────────┐
                        │    Stripe    │
                        │   Platform   │
                        └──────────────┘
```

## Components

### 1. Frontend (React + Vite + TypeScript)

**Purpose:** User interface for business onboarding and payment processing

**Tech Stack:**

- React 18 (UI library)
- Vite (build tool)
- TypeScript (type safety)
- TanStack Query (server state)
- Stripe Elements (secure payments)
- Tailwind CSS (styling)
- React Router (navigation)

**Pages:**

- **Home** - Business directory and overview
- **Onboard** - Business registration form
- **Payment** - Checkout and payment flow

**Key Features:**

- Responsive design
- Real-time updates via React Query
- Secure payment form (PCI-compliant)
- Error handling and loading states

### 2. Backend (NestJS + Prisma + PostgreSQL)

**Purpose:** API server, business logic, and Stripe integration

**Tech Stack:**

- NestJS (Node.js framework)
- Prisma ORM (database access)
- PostgreSQL (relational database)
- Stripe Node SDK (payment API)
- TypeScript (type safety)

**Modules:**

#### Business Module

- CRUD operations for businesses
- Stripe Custom Account creation
- Balance retrieval

#### Payment Module

- Payment Intent creation
- Destination charge handling
- Platform fee calculation

#### Webhook Module

- Stripe event processing
- Signature verification
- Real-time status updates

#### Stripe Module

- Stripe API wrapper
- Account management
- Payment processing

#### Prisma Module

- Database connection
- Query execution

### 3. Database (PostgreSQL)

**Schema:**

```sql
-- Businesses (Connected Accounts)
businesses
├── id (uuid, PK)
├── name (string)
├── email (string, unique)
├── stripe_account_id (string, unique)
├── stripe_account_status (string)
├── created_at (timestamp)
└── updated_at (timestamp)

-- Payments
payments
├── id (uuid, PK)
├── business_id (uuid, FK)
├── stripe_payment_intent (string, unique)
├── amount (integer, cents)
├── currency (string)
├── status (string)
├── platform_fee (integer, cents)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 4. Stripe Connect

**Account Type:** Custom Connected Accounts

**Payment Method:** Destination Charges

**Why Custom Accounts?**

- ✅ Platform creates accounts via API
- ✅ No user redirect required
- ✅ Platform controls onboarding
- ✅ Simplified compliance handling
- ✅ Best for B2B marketplaces

**Why Destination Charges?**

- ✅ Platform collects payment first
- ✅ Automatic fee deduction
- ✅ Transparent money flow
- ✅ Simple reconciliation
- ✅ Better fraud protection

## Data Flow

### 1. Business Onboarding Flow

```
┌────────┐  1. Submit Form  ┌──────────┐  2. Create Account  ┌────────┐
│ User   │─────────────────▶│ Backend  │───────────────────▶│ Stripe │
└────────┘                  └──────────┘                    └────────┘
                                  │                              │
                            3. Save to DB                   4. Return
                                  │                           Account ID
                                  ▼                              │
                            ┌──────────┐  5. Return Business    │
                            │   DB     │◀───────────────────────┘
                            └──────────┘         Data
                                  │
                            6. Display Success
                                  │
                                  ▼
                            ┌──────────┐
                            │ Frontend │
                            └──────────┘
```

### 2. Payment Flow

```
┌──────────┐  1. Select Business  ┌──────────┐
│ Customer │─────────────────────▶│ Frontend │
└──────────┘      + Amount        └──────────┘
                                        │
                                  2. Create Payment Intent
                                        │
                                        ▼
                                  ┌──────────┐  3. Create PI with
                                  │ Backend  │     Destination
                                  └──────────┘        │
                                        │             ▼
                                  4. Return     ┌────────┐
                                  Client Secret │ Stripe │
                                        │       └────────┘
                                        ▼             │
                                  ┌──────────┐       │
                                  │ Frontend │       │
                                  └──────────┘       │
                                        │            │
                                  5. Submit Payment  │
                                        │            │
                                        └───────────▶│
                                                     │
                      6. Process & Transfer         │
                         (10% fee deducted)         │
                                                     │
                                  7. Webhooks        │
                                  - payment_intent   │
                                    .succeeded       │
                                  - transfer.paid    │
                                        │            │
                                        ▼            │
                                  ┌──────────┐      │
                                  │ Backend  │◀─────┘
                                  └──────────┘
                                        │
                                  8. Update DB Status
                                        │
                                        ▼
                                  ┌──────────┐
                                  │   DB     │
                                  └──────────┘
```

### 3. Webhook Flow

```
┌────────┐  1. Event Occurs   ┌──────────┐
│ Stripe │───────────────────▶│ Backend  │
└────────┘    (account.updated,└──────────┘
              payment_intent.               │
              succeeded, etc.)               │
                                       2. Verify
                                       Signature
                                             │
                                             ▼
                                       ┌──────────┐
                                       │ Webhook  │
                                       │ Service  │
                                       └──────────┘
                                             │
                                    3. Route to Handler
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     │                       │                       │
                     ▼                       ▼                       ▼
              account.updated     payment_intent.succeeded    transfer.paid
                     │                       │                       │
              Update Business            Update Payment         Log Transfer
                Status                      Status
                     │                       │                       │
                     └───────────────────────┴───────────────────────┘
                                             │
                                             ▼
                                       ┌──────────┐
                                       │   DB     │
                                       └──────────┘
```

## Security Considerations

### 1. Environment Variables

**Backend:**

- `STRIPE_SECRET_KEY` - Never expose to frontend
- `STRIPE_WEBHOOK_SECRET` - Validates webhook authenticity
- `DATABASE_URL` - Contains database credentials

**Frontend:**

- `VITE_STRIPE_PUBLISHABLE_KEY` - Safe to expose (public key)
- `VITE_API_BASE_URL` - Points to backend

### 2. Webhook Security

- ✅ Signature verification using `stripe-signature` header
- ✅ Validates event came from Stripe
- ✅ Prevents replay attacks

### 3. Payment Security

- ✅ PCI DSS compliance via Stripe Elements
- ✅ No card data touches our servers
- ✅ Tokenization handled by Stripe
- ✅ Secure HTTPS communication

### 4. CORS Configuration

- Backend only accepts requests from configured frontend URL
- Prevents unauthorized API access

## Scaling Considerations

### Performance Optimizations

1. **Database Indexing:**

   - Index on `email` (unique searches)
   - Index on `stripe_account_id` (frequent lookups)
   - Index on `stripe_payment_intent` (webhook updates)

2. **Caching Strategy:**

   - Cache business list (invalidate on create)
   - Cache Stripe account status
   - Use React Query cache for frontend

3. **Rate Limiting:**

   - Implement request rate limiting
   - Prevent abuse of API endpoints

4. **Async Processing:**
   - Queue long-running operations
   - Use webhooks for async status updates

### High Availability

1. **Database:**

   - Use connection pooling
   - Implement read replicas
   - Regular backups

2. **Application:**

   - Horizontal scaling (multiple instances)
   - Load balancer
   - Health checks

3. **Monitoring:**
   - Log aggregation (e.g., Datadog, Sentry)
   - Stripe webhook monitoring
   - Database performance monitoring

## Deployment Architecture

### Production Setup

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │         │   Backend    │         │  PostgreSQL  │
│   (Vercel)   │────────▶│   (Heroku)   │────────▶│   (AWS RDS)  │
└──────────────┘         └──────────────┘         └──────────────┘
                                 │
                                 │ Webhooks
                                 ▼
                         ┌──────────────┐
                         │    Stripe    │
                         └──────────────┘
```

### Recommended Services

**Frontend Hosting:**

- Vercel (recommended)
- Netlify
- AWS Amplify

**Backend Hosting:**

- Heroku (easy setup)
- AWS ECS/Fargate (scalable)
- Google Cloud Run (serverless)
- Railway (developer-friendly)

**Database:**

- Heroku Postgres (simple)
- AWS RDS (production-grade)
- Supabase (with GUI)

**Monitoring:**

- Sentry (error tracking)
- Datadog (APM)
- Stripe Dashboard (payment monitoring)

## Future Enhancements

### Phase 1 - Core Improvements

- [ ] Add authentication (JWT)
- [ ] Implement authorization (RBAC)
- [ ] Add pagination for business list
- [ ] Implement search and filters

### Phase 2 - Business Features

- [ ] Business dashboard with analytics
- [ ] Payment history and exports
- [ ] Refund functionality
- [ ] Payout management
- [ ] Business onboarding verification

### Phase 3 - Advanced Features

- [ ] Multi-currency support
- [ ] Subscription billing
- [ ] Invoice generation
- [ ] Dispute management
- [ ] Advanced reporting

### Phase 4 - Scale Features

- [ ] Multi-tenant architecture
- [ ] White-label support
- [ ] API rate limiting
- [ ] Webhook retry logic
- [ ] Event sourcing

## Testing Strategy

### Backend Testing

- Unit tests (Jest)
- Integration tests (Supertest)
- Webhook mock testing
- Database fixtures

### Frontend Testing

- Component tests (React Testing Library)
- E2E tests (Playwright/Cypress)
- Visual regression tests

### Stripe Testing

- Use test mode
- Simulate webhooks with Stripe CLI
- Test different card scenarios
- Test error handling

## Troubleshooting

### Common Issues

**Issue:** Custom account not activating

- **Cause:** Missing required information
- **Solution:** Check Stripe Dashboard for requirements

**Issue:** Webhooks not received

- **Cause:** Wrong webhook secret
- **Solution:** Verify `STRIPE_WEBHOOK_SECRET` matches CLI output

**Issue:** Payment fails silently

- **Cause:** Business account not charges_enabled
- **Solution:** Wait for account activation or check Stripe logs

**Issue:** CORS errors

- **Cause:** Frontend URL not in CORS whitelist
- **Solution:** Update `FRONTEND_URL` in backend `.env`

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [Custom Accounts](https://stripe.com/docs/connect/custom-accounts)
- [Destination Charges](https://stripe.com/docs/connect/destination-charges)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)

---

**Maintained with ❤️ for learning and production use**
