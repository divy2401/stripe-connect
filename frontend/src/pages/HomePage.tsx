import { useQuery } from "@tanstack/react-query";
import {
  businessApi,
  Business,
  VerificationStatus,
  VerificationMethod,
} from "../api/client";
import { Link } from "react-router-dom";

export default function HomePage() {
  const {
    data: businesses,
    isLoading,
    error,
  } = useQuery<Business[]>({
    queryKey: ["businesses"],
    queryFn: businessApi.getAllBusinesses,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Stripe Connect Demo Platform
        </h1>
        <p className="text-xl text-white/90 mb-8">
          Custom Connected Accounts with Destination Charges
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/onboard"
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Onboard New Business
          </Link>
          <Link
            to="/payment"
            className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-600 transition"
          >
            Make a Payment
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Connected Businesses
        </h2>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading businesses...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error loading businesses. Please ensure the backend is running.
          </div>
        )}

        {businesses && businesses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No businesses onboarded yet.</p>
            <Link
              to="/onboard"
              className="text-indigo-600 hover:text-indigo-800 font-medium mt-2 inline-block"
            >
              Create your first business →
            </Link>
          </div>
        )}

        {businesses && businesses.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {business.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{business.email}</p>

                {/* Verification Status */}
                <div className="mb-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      business.verificationStatus ===
                      VerificationStatus.VERIFIED
                        ? "bg-green-100 text-green-800"
                        : business.verificationStatus ===
                            VerificationStatus.IN_REVIEW
                          ? "bg-yellow-100 text-yellow-800"
                          : business.verificationStatus ===
                              VerificationStatus.REJECTED
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {business.verificationStatus.replace("_", " ")}
                  </span>
                </div>

                {/* Verification Method */}
                <div className="mb-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      business.verificationMethod ===
                      VerificationMethod.EMBEDDED_ONBOARDING
                        ? "bg-purple-100 text-purple-800"
                        : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {business.verificationMethod ===
                    VerificationMethod.EMBEDDED_ONBOARDING
                      ? "Stripe Embedded"
                      : "Custom Form"}
                  </span>
                </div>

                {/* Account Status */}
                <div className="mb-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      business.stripeAccountStatus === "active"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {business.stripeAccountStatus}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  {business.verificationStatus ===
                    VerificationStatus.PENDING && (
                    <Link
                      to={`/verify/${business.id}`}
                      className="w-full bg-indigo-600 text-white text-center py-2 px-3 rounded text-sm font-medium hover:bg-indigo-700 transition"
                    >
                      Verify Account
                    </Link>
                  )}

                  {business.verificationStatus ===
                    VerificationStatus.REJECTED && (
                    <Link
                      to={`/verify/${business.id}`}
                      className="w-full bg-red-600 text-white text-center py-2 px-3 rounded text-sm font-medium hover:bg-red-700 transition"
                    >
                      Resubmit Verification
                    </Link>
                  )}

                  {business.verificationStatus ===
                    VerificationStatus.IN_REVIEW && (
                    <Link
                      to={`/verification-status/${business.id}`}
                      className="w-full bg-yellow-600 text-white text-center py-2 px-3 rounded text-sm font-medium hover:bg-yellow-700 transition"
                    >
                      Check Status
                    </Link>
                  )}

                  {business.verificationStatus ===
                    VerificationStatus.VERIFIED && (
                    <Link
                      to={`/payment?businessId=${business.id}`}
                      className="w-full bg-green-600 text-white text-center py-2 px-3 rounded text-sm font-medium hover:bg-green-700 transition"
                    >
                      Make Payment
                    </Link>
                  )}

                  <Link
                    to={`/verification-status/${business.id}`}
                    className="w-full bg-gray-200 text-gray-700 text-center py-2 px-3 rounded text-sm font-medium hover:bg-gray-300 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          About This Demo
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            This is a demonstration of{" "}
            <strong>Stripe Connect Custom Accounts</strong> with{" "}
            <strong>Destination Charges</strong>. Here's how it works:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Platform Creates Accounts:</strong> When you onboard a
              business, the platform automatically creates a Custom Connected
              Account via Stripe API.
            </li>
            <li>
              <strong>Destination Charges:</strong> Payments flow through the
              platform, which deducts a 10% fee before transferring to the
              business.
            </li>
            <li>
              <strong>Webhook Integration:</strong> Real-time updates for
              account status, payment success, and transfers.
            </li>
            <li>
              <strong>Balance Tracking:</strong> Each business can view their
              available and pending balance.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
