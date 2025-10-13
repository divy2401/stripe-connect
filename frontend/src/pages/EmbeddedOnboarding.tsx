import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { businessApi } from "../api/client";
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from "@stripe/react-connect-js";
import { loadConnectAndInitialize } from "@stripe/connect-js";

const EmbeddedOnboardingPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);

  // Fetch business details
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessApi.getBusinessById(businessId!),
    enabled: !!businessId,
  });

  // Create embedded onboarding link
  const createOnboardingLinkMutation = useMutation({
    mutationFn: () => businessApi.createEmbeddedOnboardingLink(businessId!),
    onSuccess: (data) => {
      console.log("Onboarding link created:", data);
    },
    onError: (error) => {
      console.error("Failed to create onboarding link:", error);
    },
  });

  // Initialize Stripe Connect
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        // First, create the onboarding session
        const result = await createOnboardingLinkMutation.mutateAsync();

        const instance = loadConnectAndInitialize({
          publishableKey:
            (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || "",
          fetchClientSecret: async () => {
            // Return the client secret from the session
            return result.clientSecret;
          },
          appearance: {
            overlays: "dialog",
            variables: {
              colorPrimary: "#0d47a1",
              buttonPrimaryColorBackground: "#0d47a1",
              buttonPrimaryColorBorder: "#e5e5e5",
            },
          },
        });
        setStripeConnectInstance(instance);
      } catch (error) {
        console.error("Failed to initialize Stripe Connect:", error);
      }
    };

    if (businessId) {
      initializeStripe();
    }
  }, [businessId]);

  const handleExit = () => {
    console.log("Onboarding exited");
    navigate(`/verification-status/${businessId}`);
  };

  if (businessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Business Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The business you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Stripe Embedded Onboarding
              </h1>
              <p className="text-gray-600 mt-1">
                Complete your business verification with Stripe
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Business Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <p className="mt-1 text-sm text-gray-900">{business.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-sm text-gray-900">{business.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Verification Status
              </label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  business.verificationStatus === "VERIFIED"
                    ? "bg-green-100 text-green-800"
                    : business.verificationStatus === "IN_REVIEW"
                      ? "bg-yellow-100 text-yellow-800"
                      : business.verificationStatus === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {business.verificationStatus.replace("_", " ")}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Verification Method
              </label>
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {business.verificationMethod === "EMBEDDED_ONBOARDING"
                  ? "Embedded Onboarding"
                  : "Custom Form"}
              </span>
            </div>
          </div>
        </div>

        {/* Stripe Embedded Onboarding */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Complete Your Verification
            </h2>
            <p className="text-gray-600 mb-6">
              Choose your preferred verification method. You can use Stripe's
              embedded form (requires Stripe login) or our custom form (no login
              required).
            </p>

            {/* Option Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => navigate(`/direct-onboarding/${businessId}`)}
                className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Direct Form
                  </h3>
                  <p className="text-sm text-gray-600">
                    No login required - fill out our custom form directly
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  // Trigger the embedded onboarding
                  if (
                    !createOnboardingLinkMutation.isPending &&
                    !stripeConnectInstance
                  ) {
                    createOnboardingLinkMutation.mutate();
                  }
                }}
                disabled={createOnboardingLinkMutation.isPending}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔐</div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Stripe Embedded
                  </h3>
                  <p className="text-sm text-gray-600">
                    Stripe's secure form (requires Stripe account login)
                  </p>
                </div>
              </button>
            </div>

            {createOnboardingLinkMutation.isPending ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Creating onboarding session...</p>
              </div>
            ) : createOnboardingLinkMutation.isError ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to Create Onboarding Session
                </h3>
                <p className="text-gray-600 mb-4">
                  There was an error creating your onboarding session. Please
                  try again.
                </p>
                <button
                  onClick={() => createOnboardingLinkMutation.mutate()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Try Again
                </button>
              </div>
            ) : stripeConnectInstance ? (
              <ConnectComponentsProvider
                connectInstance={stripeConnectInstance}
              >
                <ConnectAccountOnboarding onExit={handleExit} />
              </ConnectComponentsProvider>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Initializing Stripe Connect...</p>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About This Process
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This verification process is powered by Stripe and is designed
                  to collect all the information needed to verify your business
                  account. The information you provide will be securely
                  processed by Stripe and used to enable payment processing for
                  your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedOnboardingPage;
