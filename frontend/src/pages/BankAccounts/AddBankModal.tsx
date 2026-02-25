import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { AddBankAccountDto } from "../../api/client";
import { STRIPE_PUBLISHABLE_KEY } from "../../config";

interface AddBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddBankAccountDto) => void;
  isAdding?: boolean;
}

const AddBankModal: React.FC<AddBankModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isAdding = false,
}) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">(
    "checking"
  );
  const [accountHolderType, setAccountHolderType] = useState<
    "individual" | "company"
  >("individual");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isTokenizing, setIsTokenizing] = useState(false);

  // Initialize Stripe
  useEffect(() => {
    if (isOpen && STRIPE_PUBLISHABLE_KEY) {
      loadStripe(STRIPE_PUBLISHABLE_KEY).then((stripeInstance) => {
        setStripe(stripeInstance);
      });
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAccountHolderName("");
      setAccountType("checking");
      setAccountHolderType("individual");
      setRoutingNumber("");
      setAccountNumber("");
      setError(null);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    if (!accountHolderName.trim()) {
      setError("Please enter the account holder name");
      return false;
    }
    if (!routingNumber.trim()) {
      setError("Please enter the routing number");
      return false;
    }
    if (routingNumber.length !== 9 || !/^\d+$/.test(routingNumber)) {
      setError("Routing number must be 9 digits");
      return false;
    }
    if (!accountNumber.trim()) {
      setError("Please enter the account number");
      return false;
    }
    if (accountNumber.length < 4) {
      setError("Account number must be at least 4 digits");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    if (!stripe) {
      setError(
        "Stripe is not initialized. Please refresh the page and try again."
      );
      return;
    }

    setIsTokenizing(true);

    try {
      // Create bank account token using Stripe.js
      const { token, error: tokenError } = await stripe.createToken(
        "bank_account",
        {
          country: "US",
          currency: "usd",
          routing_number: routingNumber.trim(),
          account_number: accountNumber.trim(),
          account_holder_name: accountHolderName.trim(),
          account_holder_type: accountHolderType,
        }
      );

      if (tokenError) {
        setError(tokenError.message || "Failed to create bank account token");
        setIsTokenizing(false);
        return;
      }

      if (!token) {
        setError("Failed to create bank account token");
        setIsTokenizing(false);
        return;
      }

      // Send token to backend
      onAdd({ externalAccountToken: token.id });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
      setIsTokenizing(false);
    }
  };

  if (!isOpen) return null;

  const isFormValid =
    accountHolderName.trim() &&
    routingNumber.trim() &&
    routingNumber.length === 9 &&
    /^\d+$/.test(routingNumber) &&
    accountNumber.trim() &&
    accountNumber.length >= 4;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Add Bank Account
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={isAdding || isTokenizing}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-red-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Account Holder Name */}
            <div>
              <label
                htmlFor="accountHolderName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="accountHolderName"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isAdding || isTokenizing}
                required
              />
            </div>

            {/* Account Type */}
            <div>
              <label
                htmlFor="accountType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                id="accountType"
                value={accountType}
                onChange={(e) =>
                  setAccountType(e.target.value as "checking" | "savings")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isAdding || isTokenizing}
                required
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>

            {/* Account Holder Type */}
            <div>
              <label
                htmlFor="accountHolderType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account Holder Type <span className="text-red-500">*</span>
              </label>
              <select
                id="accountHolderType"
                value={accountHolderType}
                onChange={(e) =>
                  setAccountHolderType(
                    e.target.value as "individual" | "company"
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isAdding || isTokenizing}
                required
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select "Individual" for personal accounts or "Company" for
                business accounts
              </p>
            </div>

            {/* Routing Number */}
            <div>
              <label
                htmlFor="routingNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Routing Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="routingNumber"
                value={routingNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setRoutingNumber(value);
                }}
                placeholder="110000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isAdding || isTokenizing}
                maxLength={9}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                9-digit routing number (numbers only)
              </p>
            </div>

            {/* Account Number */}
            <div>
              <label
                htmlFor="accountNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setAccountNumber(value);
                }}
                placeholder="000123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isAdding || isTokenizing}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Account number (numbers only)
              </p>
            </div>

            {/* Security Note */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-green-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-green-800">
                  <strong>Secure:</strong> Your bank account details are
                  securely tokenized by Stripe.js before being sent to our
                  servers. We never receive or store your raw bank account
                  information.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isAdding || isTokenizing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding || isTokenizing || !isFormValid || !stripe}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTokenizing
                  ? "Securing..."
                  : isAdding
                    ? "Adding..."
                    : "Add Bank Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBankModal;
