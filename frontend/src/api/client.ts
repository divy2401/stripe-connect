import axios from "axios";
import { API_BASE_URL } from "../config";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Business {
  id: string;
  name: string;
  email: string;
  stripeAccountId: string;
  stripeAccountStatus: string;
  verificationStatus: VerificationStatus;
  verificationMethod: VerificationMethod;
  representativeInfo?: any;
  bankInfo?: any;
  createdAt: string;
  updatedAt: string;
}

export enum VerificationStatus {
  PENDING = "PENDING",
  IN_REVIEW = "IN_REVIEW",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum VerificationMethod {
  CUSTOM_FORM = "CUSTOM_FORM",
  EMBEDDED_ONBOARDING = "EMBEDDED_ONBOARDING",
}

export enum BusinessType {
  COMPANY = "company",
  INDIVIDUAL = "individual",
}

export interface RepresentativeInfo {
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

export interface BankInfo {
  accountNumber: string;
  routingNumber: string;
  accountHolderName?: string;
  bankName?: string;
}

export interface VerifyBusinessDto {
  businessName: string;
  businessType: BusinessType;
  taxId?: string;
  representativeInfo: RepresentativeInfo;
  bankInfo: BankInfo;
}

export interface VerificationStatusResponse {
  business: {
    id: string;
    name: string;
    email: string;
    stripeAccountId: string;
  };
  verificationStatus: VerificationStatus;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
    disabled_reason?: string;
  };
}

export interface CreateBusinessDto {
  name: string;
  email: string;
}

export enum ChargeType {
  DESTINATION = "destination",
  DIRECT = "direct",
  PLATFORM_COLLECTED = "platform_collected",
}

export interface CreatePaymentIntentDto {
  businessId: string;
  amount: number;
  currency?: string;
  chargeType?: ChargeType;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  platformFee: number;
  businessAmount: number;
  chargeType: ChargeType;
}

export interface BalanceResponse {
  business: {
    id: string;
    name: string;
    email: string;
    stripeAccountId: string;
  };
  balance: {
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  };
}

// Payout-related interfaces
export interface BusinessBalance {
  totalCollected: number;
  totalPaidOut: number;
  pendingBalance: number;
  platformFee: number;
  netAmount: number;
}

export interface PayoutRequest {
  businessId: string;
  amount?: number;
  reason?: string;
}

export interface PayoutResponse {
  payoutId: string;
  amount: number;
  status: string;
}

export interface PayoutHistory {
  id: string;
  businessId: string;
  stripeTransferId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformBalance {
  totalCollected: number;
  totalPaidOut: number;
  platformBalance: number;
  pendingPayouts: number;
}

export interface WeeklyPayoutResult {
  processed: number;
  totalAmount: number;
  results: Array<{ businessId: string; amount: number; status: string }>;
}

export const businessApi = {
  createBusiness: async (data: CreateBusinessDto): Promise<Business> => {
    const response = await apiClient.post("/businesses", data);
    return response.data;
  },

  getAllBusinesses: async (): Promise<Business[]> => {
    const response = await apiClient.get("/businesses");
    return response.data;
  },

  getBusinessById: async (id: string): Promise<Business> => {
    const response = await apiClient.get(`/businesses/${id}`);
    return response.data;
  },

  getBusinessBalance: async (id: string): Promise<BalanceResponse> => {
    const response = await apiClient.get(`/businesses/${id}/balance`);
    return response.data;
  },

  verifyBusiness: async (
    id: string,
    data: VerifyBusinessDto
  ): Promise<Business> => {
    const response = await apiClient.post(`/businesses/${id}/verify`, data);
    return response.data;
  },

  getVerificationStatus: async (
    id: string
  ): Promise<VerificationStatusResponse> => {
    const response = await apiClient.get(
      `/businesses/${id}/verification-status`
    );
    return response.data;
  },

  createEmbeddedOnboardingLink: async (
    id: string
  ): Promise<{ clientSecret: string }> => {
    const response = await apiClient.post(
      `/businesses/${id}/embedded-onboarding-link`
    );
    return response.data;
  },

  updateVerificationMethod: async (
    id: string,
    method: VerificationMethod
  ): Promise<Business> => {
    const response = await apiClient.post(
      `/businesses/${id}/verification-method`,
      {
        method,
      }
    );
    return response.data;
  },
};

export const paymentApi = {
  createPaymentIntent: async (
    data: CreatePaymentIntentDto
  ): Promise<PaymentIntentResponse> => {
    const response = await apiClient.post(
      "/payment/create-payment-intent",
      data
    );
    return response.data;
  },

  createDestinationCharge: async (
    data: CreatePaymentIntentDto
  ): Promise<PaymentIntentResponse> => {
    const response = await apiClient.post(
      "/payment/create-destination-charge",
      data
    );
    return response.data;
  },

  createDirectCharge: async (
    data: CreatePaymentIntentDto
  ): Promise<PaymentIntentResponse> => {
    const response = await apiClient.post(
      "/payment/create-direct-charge",
      data
    );
    return response.data;
  },
};

// Payout API methods
export const payoutApi = {
  createPlatformPayment: async (data: {
    businessId: string;
    amount: number;
    currency?: string;
  }): Promise<PaymentIntentResponse> => {
    const response = await apiClient.post(
      "/payout/create-platform-payment",
      data
    );
    return response.data;
  },

  getBusinessBalance: async (businessId: string): Promise<BusinessBalance> => {
    const response = await apiClient.get(`/payout/balance/${businessId}`);
    return response.data;
  },

  createPayout: async (data: PayoutRequest): Promise<PayoutResponse> => {
    const response = await apiClient.post("/payout/create", data);
    return response.data;
  },

  getPayoutHistory: async (businessId: string): Promise<PayoutHistory[]> => {
    const response = await apiClient.get(`/payout/history/${businessId}`);
    return response.data;
  },

  processWeeklyPayouts: async (): Promise<WeeklyPayoutResult> => {
    const response = await apiClient.post("/payout/process-weekly");
    return response.data;
  },

  getPlatformBalance: async (): Promise<PlatformBalance> => {
    const response = await apiClient.get("/payout/platform-balance");
    return response.data;
  },
};
