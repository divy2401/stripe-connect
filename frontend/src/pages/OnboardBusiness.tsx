import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { businessApi, Business } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function OnboardBusiness() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [createdBusiness, setCreatedBusiness] = useState<Business | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createBusinessMutation = useMutation({
    mutationFn: businessApi.createBusiness,
    onSuccess: (data) => {
      setCreatedBusiness(data);
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      // Reset form
      setName("");
      setEmail("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBusinessMutation.mutate({ name, email });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Onboard New Business
        </h1>
        <p className="text-gray-600 mb-8">
          Create a new business and automatically set up a Stripe Custom
          Connected Account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Business Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Acme Corporation"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Business Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="contact@acme.com"
            />
          </div>

          {createBusinessMutation.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {createBusinessMutation.error instanceof Error
                ? createBusinessMutation.error.message
                : "Failed to create business. Please try again."}
            </div>
          )}

          <button
            type="submit"
            disabled={createBusinessMutation.isPending}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {createBusinessMutation.isPending
              ? "Creating..."
              : "Create Business"}
          </button>
        </form>

        {createdBusiness && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              ✅ Business Created Successfully!
            </h3>
            <div className="space-y-2 text-sm text-green-800">
              <p>
                <strong>Name:</strong> {createdBusiness.name}
              </p>
              <p>
                <strong>Email:</strong> {createdBusiness.email}
              </p>
              <p>
                <strong>Stripe Account ID:</strong>{" "}
                {createdBusiness.stripeAccountId}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded ${
                    createdBusiness.stripeAccountStatus === "active"
                      ? "bg-green-200"
                      : "bg-yellow-200"
                  }`}
                >
                  {createdBusiness.stripeAccountStatus}
                </span>
              </p>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() =>
                  navigate(`/payment?businessId=${createdBusiness.id}`)
                }
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Make a Payment
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          How It Works
        </h2>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start">
            <span className="text-indigo-600 mr-2">1.</span>
            Enter the business details above
          </li>
          <li className="flex items-start">
            <span className="text-indigo-600 mr-2">2.</span>
            Platform creates a Custom Connected Account on Stripe
          </li>
          <li className="flex items-start">
            <span className="text-indigo-600 mr-2">3.</span>
            Business is ready to accept payments immediately
          </li>
          <li className="flex items-start">
            <span className="text-indigo-600 mr-2">4.</span>
            Platform handles all payment processing and fee distribution
          </li>
        </ul>
      </div>
    </div>
  );
}
