import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { stripeExpressApi } from "../api/client";
import { STRIPE_EXPRESS_ACCOUNT_KEY } from "./StripeExpressConnect";

export default function StripeReturn() {
  const [status, setStatus] = useState<{
    loading: boolean;
    onboardingCompleted: boolean | null;
    error: string | null;
  }>({ loading: true, onboardingCompleted: null, error: null });

  useEffect(() => {
    const accountId = sessionStorage.getItem(STRIPE_EXPRESS_ACCOUNT_KEY);
    if (!accountId) {
      setStatus({
        loading: false,
        onboardingCompleted: null,
        error: "No Express account in session. Start from Connect with Stripe.",
      });
      return;
    }

    stripeExpressApi
      .getAccountStatus(accountId)
      .then((data) => {
        setStatus({
          loading: false,
          onboardingCompleted: data.onboardingCompleted,
          error: null,
        });
      })
      .catch((err) => {
        setStatus({
          loading: false,
          onboardingCompleted: null,
          error:
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load account status",
        });
      });
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Stripe Express — Return
        </h1>

        {status.loading && (
          <p className="text-gray-600">Checking onboarding status…</p>
        )}

        {!status.loading && status.error && (
          <>
            <p className="text-red-600 mb-4">{status.error}</p>
            <Link
              to="/stripe-express"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Connect with Stripe
            </Link>
          </>
        )}

        {!status.loading && !status.error && status.onboardingCompleted === true && (
          <>
            <p className="text-green-600 font-medium mb-4">
              Onboarding complete. You can accept payments and receive payouts.
            </p>
            <Link
              to="/stripe-express"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Connect
            </Link>
          </>
        )}

        {!status.loading &&
          !status.error &&
          status.onboardingCompleted === false && (
            <>
              <p className="text-amber-600 font-medium mb-4">
                Onboarding incomplete. Complete the steps in Stripe to finish.
              </p>
              <Link
                to="/stripe/refresh"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Continue onboarding
              </Link>
            </>
          )}
      </div>
    </div>
  );
}
