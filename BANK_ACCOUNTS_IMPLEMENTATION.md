# Multiple Bank Accounts Implementation Guide

This document describes the complete implementation of multiple bank account support for Stripe Connect Custom Accounts.

## 📋 Overview

The implementation adds full support for businesses to manage multiple bank accounts (payout destinations) with the following features:
- Add multiple bank accounts via Stripe tokens
- List all bank accounts for a business
- Set a default payout bank account
- Remove bank accounts
- Embedded onboarding with bank account collection
- Webhook synchronization for bank account events

## 🗄️ Database Changes

### New Prisma Model

```prisma
model BankAccount {
    id               String   @id @default(cuid())
    businessId       String
    externalAccountId String   @unique
    bankName         String?
    last4            String
    isDefault        Boolean  @default(false)
    currency         String   @default("usd")
    status           String?
    createdAt        DateTime @default(now())
    updatedAt        DateTime @updatedAt

    business         Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
}
```

### Migration Steps

1. **Generate Prisma migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_bank_accounts
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

This will resolve all TypeScript linter errors related to `bankAccount` model access.

## 🔧 Backend Implementation

### New Module: `bank-accounts`

**Location:** `backend/src/bank-accounts/`

**Files:**
- `bank-account.controller.ts` - REST API endpoints
- `bank-account.service.ts` - Business logic
- `bank-account.module.ts` - NestJS module
- `dto/add-bank-account.dto.ts` - Add bank account DTO
- `dto/set-default-bank.dto.ts` - Set default bank DTO

### API Endpoints

#### POST `/businesses/:id/bank-accounts`
Add a bank account to a business.

**Request:**
```json
{
  "externalAccountToken": "btok_us_verified"
}
```

**Response:**
```json
{
  "id": "cuid...",
  "businessId": "uuid",
  "externalAccountId": "ba_...",
  "bankName": "STRIPE TEST BANK",
  "last4": "6789",
  "isDefault": true,
  "currency": "usd",
  "status": "verified",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### GET `/businesses/:id/bank-accounts`
List all bank accounts for a business.

**Response:**
```json
[
  {
    "id": "cuid...",
    "businessId": "uuid",
    "externalAccountId": "ba_...",
    "bankName": "STRIPE TEST BANK",
    "last4": "6789",
    "isDefault": true,
    "currency": "usd",
    "status": "verified",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### PATCH `/businesses/:id/bank-accounts/default`
Set a bank account as the default for payouts.

**Request:**
```json
{
  "bankAccountId": "cuid..."
}
```

#### DELETE `/businesses/:id/bank-accounts/:bankId`
Remove a bank account from a business.

**Response:** 204 No Content

### Stripe Service Updates

New methods in `stripe.service.ts`:
- `addExternalAccount()` - Add bank account via token
- `setDefaultExternalAccount()` - Set default payout destination
- `deleteExternalAccount()` - Remove bank account
- `getExternalAccounts()` - List all external accounts

### Webhook Updates

**New webhook handlers in `webhook.service.ts`:**
- `account.external_account.created` - Sync new bank accounts
- `account.external_account.updated` - Update bank account status
- `account.external_account.deleted` - Remove from database

**Webhook Configuration:**
Ensure your Stripe webhook endpoint is configured to receive these events:
- `account.external_account.created`
- `account.external_account.updated`
- `account.external_account.deleted`

## 🎨 Frontend Implementation

### New Components

**Location:** `frontend/src/pages/BankAccounts/`

**Files:**
- `BankAccountsPage.tsx` - Main page listing all bank accounts
- `BankAccountCard.tsx` - Card component for each bank account
- `AddBankModal.tsx` - Modal for adding new bank accounts

### API Client Updates

**Location:** `frontend/src/api/client.ts`

New interfaces:
```typescript
export interface BankAccount {
  id: string;
  businessId: string;
  externalAccountId: string;
  bankName?: string;
  last4: string;
  isDefault: boolean;
  currency: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddBankAccountDto {
  externalAccountToken: string;
}
```

New API methods:
- `bankAccountApi.addBankAccount()`
- `bankAccountApi.getBankAccounts()`
- `bankAccountApi.setDefaultBankAccount()`
- `bankAccountApi.removeBankAccount()`

### Routes

**New route:** `/bank-accounts/:businessId`

Added to `App.tsx` routing configuration.

## 🧪 Testing

### Test Tokens (Stripe Test Mode)

Use these test tokens for adding bank accounts:

- `btok_us_verified` - Verified US bank account (instant verification)
- `btok_us_debit` - US debit account

### Testing Flow

1. **Create a business:**
   ```bash
   # Use the frontend to create a business
   ```

2. **Add a bank account:**
   - Navigate to `/bank-accounts/:businessId`
   - Click "Add Bank Account"
   - Use test token: `btok_us_verified`
   - Verify it appears in the list

3. **Set as default:**
   - Click "Set as Default" on a bank account
   - Verify the default badge appears

4. **Add another bank account:**
   - Add a second bank account
   - Verify both appear in the list

5. **Remove a bank account:**
   - Click "Remove" on a non-default account
   - Verify it's removed from the list

6. **Test webhook sync:**
   ```bash
   # Start Stripe CLI webhook forwarding
   stripe listen --forward-to localhost:3001/webhook/connected-account
   
   # Trigger test events
   stripe trigger account.external_account.created
   stripe trigger account.external_account.updated
   stripe trigger account.external_account.deleted
   ```

### Embedded Onboarding Test

1. Navigate to embedded onboarding for a business
2. Complete the onboarding flow
3. If bank account is collected during onboarding, verify it appears in the bank accounts list
4. Check webhook logs for `account.external_account.created` event

## 🔐 Security Considerations

1. **Token-based approach:** Bank account details are never sent directly to the server. Only Stripe tokens are used.

2. **Validation:** 
   - Business ownership is verified before allowing bank account operations
   - Last bank account cannot be removed (prevents lockout)

3. **Webhook verification:** All webhook events are verified using Stripe signatures.

4. **Default account enforcement:** Only one default bank account per business is maintained.

## 📝 Environment Variables

No new environment variables are required. Existing webhook secrets are used:
- `STRIPE_WEBHOOK_SECRET_CONNECTED_ACCOUNT` - For connected account webhooks
- `STRIPE_SECRET_KEY` - Stripe API key

## 🚀 Deployment Checklist

- [ ] Run Prisma migration: `npx prisma migrate deploy`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Configure webhook endpoints in Stripe Dashboard
- [ ] Ensure webhook events are enabled:
  - `account.external_account.created`
  - `account.external_account.updated`
  - `account.external_account.deleted`
- [ ] Test with real Stripe test tokens
- [ ] Verify webhook signature verification is working

## 🐛 Troubleshooting

### Prisma Client Errors

If you see errors about `bankAccount` not existing:
```bash
cd backend
npx prisma generate
```

### Webhook Not Receiving Events

1. Check webhook endpoint URL in Stripe Dashboard
2. Verify webhook secret is correct
3. Check backend logs for signature verification errors
4. Use Stripe CLI to test webhook forwarding

### Bank Account Not Appearing

1. Check webhook logs for `account.external_account.created` event
2. Verify business exists in database
3. Check Stripe Dashboard for external accounts on the connected account
4. Verify database migration was successful

## 📚 Additional Resources

- [Stripe External Accounts Documentation](https://stripe.com/docs/api/external_accounts)
- [Stripe Connect Bank Accounts](https://stripe.com/docs/connect/bank-accounts)
- [Stripe Test Tokens](https://stripe.com/docs/testing)

---

**Implementation Complete!** 🎉

All features have been implemented and are ready for testing. Run the Prisma migration to generate the client and start testing.

