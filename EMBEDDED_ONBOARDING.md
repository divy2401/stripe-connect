# Stripe Embedded Onboarding Integration

This document describes the enhanced verification system that supports both custom forms and Stripe's embedded onboarding.

## 🎯 Overview

The platform now supports two verification methods:

1. **Custom Form** - Our in-house KYC collection form
2. **Embedded Onboarding** - Stripe's secure, embedded verification form

## 🏗️ Architecture

### Backend Changes

#### Database Schema

```prisma
enum VerificationMethod {
  CUSTOM_FORM
  EMBEDDED_ONBOARDING
}

model Business {
  // ... existing fields
  verificationMethod  VerificationMethod @default(CUSTOM_FORM)
}
```

#### New Endpoints

**POST /businesses/:id/embedded-onboarding-link**

- Creates a Stripe Account Session for embedded onboarding
- Returns `clientSecret` for frontend integration
- Automatically sets `verificationMethod` to `EMBEDDED_ONBOARDING`

**POST /businesses/:id/verification-method**

- Updates the verification method for a business
- Body: `{ method: "CUSTOM_FORM" | "EMBEDDED_ONBOARDING" }`

#### Stripe Service Updates

- Added `createEmbeddedOnboardingSession()` method
- Uses Stripe Accounts v2 API with `accountSessions.create()`
- Enables `account_onboarding` component with external account collection

### Frontend Changes

#### New Dependencies

```json
{
  "@stripe/react-connect-js": "^1.0.0",
  "@stripe/connect-js": "^1.0.0"
}
```

#### New Pages

**/onboarding/:businessId**

- Embedded onboarding page using Stripe Connect JS
- Loads Stripe's embedded verification form
- Handles completion and error states

**Enhanced /verify/:businessId**

- Now shows verification method selection
- Two options: Custom Form vs Embedded Onboarding
- Conditional rendering based on selected method

#### API Client Updates

- Added `VerificationMethod` enum
- Added `createEmbeddedOnboardingLink()` method
- Added `updateVerificationMethod()` method
- Updated `Business` interface with `verificationMethod` field

## 🔄 Verification Flow

### Custom Form Flow

1. User selects "Custom Form" on `/verify/:businessId`
2. Fills out multi-step form (Business Info → Representative Info → Bank Details)
3. Submits via `POST /businesses/:id/verify`
4. Backend updates Stripe account with collected data
5. Status updates via webhook `account.updated`

### Embedded Onboarding Flow

1. User selects "Stripe Embedded Onboarding" on `/verify/:businessId`
2. Redirects to `/onboarding/:businessId`
3. Frontend calls `POST /businesses/:id/embedded-onboarding-link`
4. Backend creates Stripe Account Session
5. Frontend loads Stripe's embedded form
6. User completes verification in Stripe's secure form
7. Status updates via webhook `account.updated`

## 🎨 UI/UX Features

### Verification Method Selection

- Clean, card-based selection interface
- Visual icons and descriptions for each method
- Hover effects and smooth transitions

### Embedded Onboarding Page

- Business information display
- Stripe Connect JS integration
- Loading states and error handling
- Help text and guidance

### Homepage Updates

- Shows verification method badge on business cards
- Color-coded indicators (Purple for Embedded, Indigo for Custom)
- Contextual action buttons based on verification status

## 🔧 Configuration

### Environment Variables

**Backend (.env)**

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
```

**Frontend (.env)**

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:3001
```

### Stripe Connect Setup

1. **Enable Connect in Stripe Dashboard**
   - Go to Connect settings
   - Enable Custom accounts
   - Configure webhook endpoints

2. **Webhook Configuration**
   - Endpoint: `https://your-domain.com/webhook`
   - Events: `account.updated`, `payment_intent.succeeded`, `transfer.created`

3. **Account Sessions**
   - Ensure your Stripe account supports Account Sessions
   - Verify API version compatibility (2025-09-30.clover)

## 🚀 Usage

### For Businesses

1. **Create Business Account**

   ```bash
   POST /businesses
   {
     "name": "My Business",
     "email": "business@example.com"
   }
   ```

2. **Choose Verification Method**
   - Visit `/verify/:businessId`
   - Select preferred verification method
   - Complete verification process

3. **Monitor Status**
   - Check `/verification-status/:businessId`
   - Real-time status updates via webhooks

### For Developers

1. **Install Dependencies**

   ```bash
   # Frontend
   npm install @stripe/react-connect-js @stripe/connect-js

   # Backend (already included)
   npm install stripe
   ```

2. **Run Database Migration**

   ```bash
   npx prisma migrate dev --name add-verification-method
   ```

3. **Start Development Servers**

   ```bash
   # Backend
   npm run dev

   # Frontend
   npm run dev
   ```

## 🔒 Security Considerations

### Data Handling

- **Custom Form**: Data collected and stored in your database
- **Embedded Onboarding**: Data handled entirely by Stripe
- Both methods use secure HTTPS endpoints

### Webhook Security

- Verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
- Idempotent webhook handling
- Error logging and monitoring

### API Security

- Server-side session creation only
- No client-side Stripe secret key exposure
- Proper CORS configuration

## 📊 Monitoring & Analytics

### Webhook Events

- `account.updated` - Verification status changes
- `payment_intent.succeeded` - Payment completions
- `transfer.created` - Fund transfers

### Database Tracking

- `verificationStatus` - Current verification state
- `verificationMethod` - Method used for verification
- `representativeInfo` - Collected representative data (custom form only)
- `bankInfo` - Bank account information (custom form only)

## 🐛 Troubleshooting

### Common Issues

1. **Embedded Onboarding Not Loading**
   - Check Stripe publishable key
   - Verify Account Session creation
   - Check browser console for errors

2. **Webhook Not Updating Status**
   - Verify webhook endpoint URL
   - Check webhook secret configuration
   - Monitor webhook delivery in Stripe Dashboard

3. **Database Migration Issues**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL configuration
   - Run `npx prisma generate` after migration

### Debug Mode

- Enable Stripe test mode for development
- Use Stripe CLI for webhook testing: `stripe listen --forward-to localhost:3001/webhook`
- Check application logs for detailed error messages

## 🔄 Migration Guide

### From Custom Form Only

1. Run database migration
2. Update frontend dependencies
3. Deploy backend changes
4. Deploy frontend changes
5. Test both verification methods

### Existing Businesses

- Existing businesses default to `CUSTOM_FORM` method
- Can switch to `EMBEDDED_ONBOARDING` via API or UI
- Verification status remains unchanged

## 📈 Future Enhancements

### Planned Features

- [ ] Verification method switching after initial setup
- [ ] Bulk verification method updates
- [ ] Advanced analytics dashboard
- [ ] Multi-language support for embedded onboarding
- [ ] Custom branding for embedded forms

### API Improvements

- [ ] GraphQL support
- [ ] Real-time status updates via WebSockets
- [ ] Batch operations for multiple businesses
- [ ] Advanced filtering and search

## 📚 Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect JS SDK](https://stripe.com/docs/connect/connect-js)
- [Account Sessions API](https://stripe.com/docs/api/account_sessions)
- [Embedded Onboarding Guide](https://stripe.com/docs/connect/embedded-onboarding)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
