import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { businessApi, paymentApi, payoutApi, ChargeType } from "../api/client";
import { STRIPE_PUBLISHABLE_KEY } from "../config";
import CheckoutForm from "../components/CheckoutForm";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const preselectedBusinessId = searchParams.get("businessId");

  const [selectedBusinessId, setSelectedBusinessId] = useState(
    preselectedBusinessId || ""
  );
  const [amount, setAmount] = useState("50.00");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const { data: businesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessApi.getAllBusinesses,
  });

  const createDestinationChargeMutation = useMutation({
    mutationFn: paymentApi.createDestinationCharge,
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPaymentDetails(data);
    },
  });

  const createDirectChargeMutation = useMutation({
    mutationFn: paymentApi.createDirectCharge,
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPaymentDetails(data);
    },
  });

  const createPlatformPaymentMutation = useMutation({
    mutationFn: payoutApi.createPlatformPayment,
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPaymentDetails(data);
    },
  });

  useEffect(() => {
    if (preselectedBusinessId) {
      setSelectedBusinessId(preselectedBusinessId);
    }
  }, [preselectedBusinessId]);

  const handleCreatePayment = (chargeType: ChargeType) => {
    if (!selectedBusinessId || !amount) return;

    const amountInCents = Math.round(parseFloat(amount) * 100);
    const paymentData = {
      businessId: selectedBusinessId,
      amount: amountInCents,
      currency: "usd",
    };

    if (chargeType === ChargeType.DESTINATION) {
      createDestinationChargeMutation.mutate(paymentData);
    } else if (chargeType === ChargeType.DIRECT) {
      createDirectChargeMutation.mutate(paymentData);
    } else if (chargeType === ChargeType.PLATFORM_COLLECTED) {
      createPlatformPaymentMutation.mutate(paymentData);
    }
  };

  const selectedBusiness = businesses?.find((b) => b.id === selectedBusinessId);

  const appearance = {
    theme: "stripe" as const,
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Make a Payment
        </h1>
        <p className="text-gray-600 mb-8">
          Process a payment to a connected business account.
        </p>

        {!clientSecret ? (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="business"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Business
              </label>
              <select
                id="business"
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">-- Choose a business --</option>
                {businesses?.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name} ({business.stripeAccountStatus})
                  </option>
                ))}
              </select>
            </div>

            {selectedBusiness &&
              selectedBusiness.stripeAccountStatus !== "active" && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  ⚠️ This business account is not fully activated yet. Payments
                  may not be processed.
                </div>
              )}

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.50"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="50.00"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Platform fee (10%): ${(parseFloat(amount) * 0.1).toFixed(2)} |
                Business receives: ${(parseFloat(amount) * 0.9).toFixed(2)}
              </p>
            </div>

            {(createDestinationChargeMutation.error ||
              createDirectChargeMutation.error) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {createDestinationChargeMutation.error instanceof Error
                  ? createDestinationChargeMutation.error.message
                  : createDirectChargeMutation.error instanceof Error
                    ? createDirectChargeMutation.error.message
                    : "Failed to create payment intent."}
              </div>
            )}

            <div className="space-y-3">
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Choose Payment Type:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Destination Charge Button */}
                  <button
                    onClick={() => handleCreatePayment(ChargeType.DESTINATION)}
                    disabled={
                      !selectedBusinessId ||
                      !amount ||
                      createDestinationChargeMutation.isPending ||
                      createDirectChargeMutation.isPending ||
                      createPlatformPaymentMutation.isPending ||
                      parseFloat(amount) < 0.5
                    }
                    className="flex flex-col items-center justify-center bg-indigo-600 text-white py-4 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    <span className="text-lg mb-1">💳 Destination Charge</span>
                    <span className="text-xs font-normal opacity-90">
                      Platform collects, then transfers
                    </span>
                    {createDestinationChargeMutation.isPending && (
                      <span className="text-xs mt-1">Processing...</span>
                    )}
                  </button>

                  {/* Direct Charge Button */}
                  <button
                    onClick={() => handleCreatePayment(ChargeType.DIRECT)}
                    disabled={
                      !selectedBusinessId ||
                      !amount ||
                      createDestinationChargeMutation.isPending ||
                      createDirectChargeMutation.isPending ||
                      createPlatformPaymentMutation.isPending ||
                      parseFloat(amount) < 0.5
                    }
                    className="flex flex-col items-center justify-center bg-purple-600 text-white py-4 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    <span className="text-lg mb-1">⚡ Direct Charge</span>
                    <span className="text-xs font-normal opacity-90">
                      Direct to connected account
                    </span>
                    {createDirectChargeMutation.isPending && (
                      <span className="text-xs mt-1">Processing...</span>
                    )}
                  </button>

                  {/* Platform Collected Button */}
                  <button
                    onClick={() =>
                      handleCreatePayment(ChargeType.PLATFORM_COLLECTED)
                    }
                    disabled={
                      !selectedBusinessId ||
                      !amount ||
                      createDestinationChargeMutation.isPending ||
                      createDirectChargeMutation.isPending ||
                      createPlatformPaymentMutation.isPending ||
                      parseFloat(amount) < 0.5
                    }
                    className="flex flex-col items-center justify-center bg-green-600 text-white py-4 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    <span className="text-lg mb-1">🏦 Platform Collected</span>
                    <span className="text-xs font-normal opacity-90">
                      Platform manages payouts
                    </span>
                    {createPlatformPaymentMutation.isPending && (
                      <span className="text-xs mt-1">Processing...</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Payment Details
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Business:</strong> {selectedBusiness?.name}
                </p>
                <p>
                  <strong>Charge Type:</strong>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      paymentDetails.chargeType === "destination"
                        ? "bg-indigo-100 text-indigo-800"
                        : paymentDetails.chargeType === "direct"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {paymentDetails.chargeType === "destination"
                      ? "Destination Charge"
                      : paymentDetails.chargeType === "direct"
                        ? "Direct Charge"
                        : "Platform Collected"}
                  </span>
                </p>
                <p>
                  <strong>Total Amount:</strong> $
                  {(paymentDetails.amount / 100).toFixed(2)}
                </p>
                <p>
                  <strong>Platform Fee:</strong> $
                  {(paymentDetails.platformFee / 100).toFixed(2)}
                </p>
                <p>
                  <strong>Business Receives:</strong> $
                  {(paymentDetails.businessAmount / 100).toFixed(2)}
                </p>
              </div>
            </div>

            {clientSecret && (
              <Elements options={options} stripe={stripePromise}>
                <CheckoutForm
                  clientSecret={clientSecret}
                  onBack={() => {
                    setClientSecret("");
                    setPaymentDetails(null);
                  }}
                />
              </Elements>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Payment Flow Options
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Destination Charges */}
          <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
            <h3 className="font-semibold text-indigo-900 mb-2 flex items-center">
              <span className="mr-2">💳</span> Destination Charges
            </h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Platform collects payment first
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Automatic transfer to business
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Platform deducts 10% fee
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Better fraud protection
              </li>
            </ul>
          </div>

          {/* Direct Charges */}
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
              <span className="mr-2">⚡</span> Direct Charges
            </h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Payment goes directly to business
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Platform charges 10% fee separately
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Business has more control
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Faster fund availability
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
