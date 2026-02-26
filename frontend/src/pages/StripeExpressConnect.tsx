import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { stripeExpressApi } from "../api/client";

const STRIPE_EXPRESS_ACCOUNT_KEY = "stripe_express_account_id";

export default function StripeExpressConnect() {
  const [userId, setUserId] = useState(1);
  const [email, setEmail] = useState("");

  const connectMutation = useMutation({
    mutationFn: async () => {
      const account = await stripeExpressApi.createExpressAccount({
        userId: Number(userId),
        email: email.trim(),
      });
      const { url } = await stripeExpressApi.generateOnboardingLink(
        account.stripeAccountId
      );
      sessionStorage.setItem(STRIPE_EXPRESS_ACCOUNT_KEY, account.stripeAccountId);
      window.location.href = url;
    },
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    connectMutation.mutate();
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Connect with Stripe (Express)
        </h1>
        <p className="text-gray-600 mb-6">
          Create a Stripe Express account and complete onboarding in Stripe’s
          hosted flow. You’ll be redirected back here when done.
        </p>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              User ID
            </label>
            <input
              type="number"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(Number(e.target.value) || 1)}
              min={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          {connectMutation.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {connectMutation.error instanceof Error
                ? connectMutation.error.message
                : "Something went wrong"}
            </div>
          )}

          <button
            type="submit"
            disabled={connectMutation.isPending || !email.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectMutation.isPending ? (
              "Redirecting…"
            ) : (
              <>
                <span>Connect with Stripe</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export { STRIPE_EXPRESS_ACCOUNT_KEY };
