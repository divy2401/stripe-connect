# 🔐 Custom Verification Flow Documentation

## 🎯 Overview

This document describes the **custom in-house verification flow** implemented for Stripe Connect Custom Accounts. Instead of using Stripe's hosted onboarding, the platform collects KYC information through custom forms and submits it directly to Stripe via the Accounts API.

---

## 🏗️ Architecture

### **Flow Diagram**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │     Stripe      │
│   (React)       │    │   (NestJS)      │    │      API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Submit Form        │                       │
         ├──────────────────────►│                       │
         │                       │ 2. Update Account     │
         │                       ├──────────────────────►│
         │                       │                       │
         │                       │ 3. Webhook Event      │
         │                       │◄──────────────────────┤
         │ 4. Status Update      │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
```

---

## 📊 Database Schema

### **Business Model Updates**

```prisma
model Business {
  id                  String             @id @default(uuid())
  name                String
  email               String             @unique
  stripeAccountId     String             @unique
  stripeAccountStatus String             @default("pending")
  verificationStatus  VerificationStatus @default(PENDING)
  representativeInfo  Json?              // Stores representative details
  bankInfo            Json?              // Stores bank account info (masked)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
}

enum VerificationStatus {
  PENDING    // Initial state, needs verification
  IN_REVIEW  // Submitted to Stripe, under review
  VERIFIED   // Approved by Stripe
  REJECTED   // Rejected by Stripe
}
```

---

## 🔧 Backend Implementation

### **1. Verification DTOs**

**`VerifyBusinessDto`** - Main verification payload:

```typescript
interface VerifyBusinessDto {
  businessName: string;
  businessType: "company" | "individual";
  taxId?: string;
  representativeInfo: RepresentativeInfo;
  bankInfo: BankInfo;
}
```

**`RepresentativeInfo`** - Individual details:

```typescript
interface RepresentativeInfo {
  firstName: string;
  lastName: string;
  dobDay: number;
  dobMonth: number;
  dobYear: number;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

**`BankInfo`** - Bank account details:

```typescript
interface BankInfo {
  accountNumber: string;
  routingNumber: string;
  accountHolderName?: string;
  bankName?: string;
}
```

### **2. API Endpoints**

#### **POST `/businesses/:id/verify`**

- **Purpose:** Submit verification data to Stripe
- **Payload:** `VerifyBusinessDto`
- **Response:** Updated `Business` object
- **Process:**
  1. Validates business exists
  2. Updates Stripe account with verification data
  3. Sets verification status to `IN_REVIEW`
  4. Stores masked bank info in database

#### **GET `/businesses/:id/verification-status`**

- **Purpose:** Get current verification status
- **Response:** Detailed status information
- **Includes:**
  - Current verification status
  - Stripe account capabilities (`charges_enabled`, `payouts_enabled`)
  - Requirements status (`currently_due`, `past_due`, etc.)

### **3. Stripe Integration**

**`updateAccountVerification()`** method:

```typescript
async updateAccountVerification(accountId: string, params: {
  businessType: string;
  businessName: string;
  taxId?: string;
  representativeInfo: any;
  bankInfo: any;
}): Promise<Stripe.Account>
```

**Key Features:**

- Updates business type and company information
- Sets individual/representative details
- Adds external bank account
- Requests `transfers` and `card_payments` capabilities
- Accepts Terms of Service automatically

### **4. Webhook Handling**

**Enhanced `account.updated` handler:**

```typescript
private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
  // Update business status
  const status = account.charges_enabled ? "active" : "pending";
  await this.businessService.updateBusinessStatus(account.id, status);

  // Update verification status based on Stripe requirements
  let verificationStatus = 'IN_REVIEW';

  if (account.charges_enabled && account.payouts_enabled) {
    verificationStatus = 'VERIFIED';
  } else if (account.requirements?.disabled_reason) {
    verificationStatus = 'REJECTED';
  } else if (account.requirements?.currently_due?.length === 0) {
    verificationStatus = 'VERIFIED';
  }

  await this.businessService.updateVerificationStatus(account.id, verificationStatus);
}
```

---

## 🖥️ Frontend Implementation

### **1. Verification Form (`/verify/:businessId`)**

**Multi-step form with 3 sections:**

#### **Step 1: Business Information**

- Business name
- Business type (Company/Individual)
- Tax ID (optional)

#### **Step 2: Representative Information**

- Personal details (name, DOB, email, phone)
- Complete address information
- Country selection

#### **Step 3: Bank Account Information**

- Account holder name
- Bank name
- Routing number
- Account number
- Security notice about data encryption

**Features:**

- Form validation with error handling
- Progress indicator
- Step-by-step navigation
- Responsive design
- Security warnings for sensitive data

### **2. Verification Status (`/verification-status/:businessId`)**

**Real-time status monitoring:**

- Current verification status with color-coded badges
- Account capabilities (charges/payouts enabled)
- Detailed requirements breakdown
- Auto-refresh every 5 seconds
- Action buttons based on status

**Status Display:**

- **PENDING:** "Start Verification" button
- **IN_REVIEW:** "Check Status" button with polling
- **VERIFIED:** "Make Payment" button
- **REJECTED:** "Resubmit Verification" button

### **3. Enhanced Business List**

**Updated business cards show:**

- Verification status badge
- Account status badge
- Contextual action buttons
- Direct links to verification flow

---

## 🔄 Verification Flow States

### **1. PENDING**

- **Trigger:** Business created
- **UI:** "Verify Account" button
- **Action:** Navigate to verification form

### **2. IN_REVIEW**

- **Trigger:** Verification submitted to Stripe
- **UI:** "Check Status" button with polling
- **Action:** Show status page with auto-refresh

### **3. VERIFIED**

- **Trigger:** Stripe approves account
- **UI:** "Make Payment" button
- **Action:** Enable payment processing

### **4. REJECTED**

- **Trigger:** Stripe rejects verification
- **UI:** "Resubmit Verification" button
- **Action:** Allow form resubmission

---

## 🛡️ Security & Privacy

### **Data Protection**

- **Bank Account Numbers:** Only last 4 digits stored in database
- **Encryption:** All data encrypted in transit to Stripe
- **Validation:** Server-side validation of all inputs
- **Sanitization:** Input sanitization to prevent injection

### **Stripe Security**

- **PCI Compliance:** Stripe handles sensitive payment data
- **Tokenization:** Bank account details tokenized by Stripe
- **Audit Trail:** All verification attempts logged

---

## 🧪 Testing the Flow

### **1. Create Business**

```bash
curl -X POST http://localhost:3001/businesses \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Company", "email": "test@example.com"}'
```

### **2. Submit Verification**

```bash
curl -X POST http://localhost:3001/businesses/{businessId}/verify \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Company",
    "businessType": "company",
    "representativeInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "dobDay": 1,
      "dobMonth": 1,
      "dobYear": 1990,
      "email": "john@example.com",
      "phone": "+1234567890",
      "addressLine1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    },
    "bankInfo": {
      "accountNumber": "1234567890",
      "routingNumber": "021000021"
    }
  }'
```

### **3. Check Status**

```bash
curl http://localhost:3001/businesses/{businessId}/verification-status
```

---

## 📋 Requirements Checklist

### **Business Information**

- ✅ Business name
- ✅ Business type (company/individual)
- ✅ Tax ID (optional for companies)

### **Representative Information**

- ✅ First and last name
- ✅ Date of birth
- ✅ Email address
- ✅ Phone number
- ✅ Complete address (line 1, city, state, postal code, country)
- ✅ Address line 2 (optional)

### **Bank Account Information**

- ✅ Account number
- ✅ Routing number (US)
- ✅ Account holder name (optional)
- ✅ Bank name (optional)

---

## 🚀 Production Considerations

### **Environment Variables**

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://...

# Security
TOS_ACCEPTANCE_IP=actual_client_ip
```

### **Error Handling**

- Network timeouts
- Stripe API errors
- Validation failures
- Database connection issues

### **Monitoring**

- Verification success rates
- Average processing time
- Error frequency
- Webhook delivery status

### **Compliance**

- GDPR data handling
- PCI DSS requirements
- KYC/AML regulations
- Audit logging

---

## 🔗 Related Documentation

- [Stripe Connect Custom Accounts](https://stripe.com/docs/connect/custom-accounts)
- [Stripe Accounts API](https://stripe.com/docs/api/accounts)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Verification Requirements](https://stripe.com/docs/connect/identity-verification)

---

## 📞 Support

For issues with the verification flow:

1. **Check Stripe Dashboard:** Account status and requirements
2. **Review Webhook Logs:** Event processing status
3. **Database Verification:** Local status synchronization
4. **API Testing:** Endpoint functionality

**Key Files:**

- Backend: `src/business/business.service.ts`
- Frontend: `src/pages/VerifyBusiness.tsx`
- Webhooks: `src/webhook/webhook.service.ts`
- Schema: `prisma/schema.prisma`

---

_Last Updated: October 2025_  
_Version: 1.0.0_  
_Stripe API: 2025-09-30.clover_
