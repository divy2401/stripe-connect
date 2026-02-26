import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { stripeExpressApi } from "../api/client";
import { STRIPE_EXPRESS_ACCOUNT_KEY } from "./StripeExpressConnect";

export default function StripeRefresh() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accountId = sessionStorage.getItem(STRIPE_EXPRESS_ACCOUNT_KEY);
    if (!accountId) {
      setError("No Express account in session. Start from Connect with Stripe.");
      return;
    }

    stripeExpressApi
      .generateOnboardingLink(accountId)
      .then(({ url }) => {
        window.location.href = url;
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to generate onboarding link"
        );
      });
  }, []);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Stripe Express — Refresh
          </h1>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            to="/stripe-express"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Connect with Stripe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Stripe Express — Refresh
        </h1>
        <p className="text-gray-600">Redirecting to Stripe onboarding…</p>
      </div>
    </div>
  );
}
