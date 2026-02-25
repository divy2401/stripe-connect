import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { bankAccountApi, businessApi } from "../../api/client";
import BankAccountCard from "./BankAccountCard";
import AddBankModal from "./AddBankModal";
import { AddBankAccountDto } from "../../api/client";

const BankAccountsPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch business details
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessApi.getBusinessById(businessId!),
    enabled: !!businessId,
  });

  // Fetch bank accounts
  const {
    data: bankAccounts,
    isLoading: bankAccountsLoading,
    error: bankAccountsError,
  } = useQuery({
    queryKey: ["bankAccounts", businessId],
    queryFn: () => bankAccountApi.getBankAccounts(businessId!),
    enabled: !!businessId,
  });

  // Add bank account mutation
  const addBankAccountMutation = useMutation({
    mutationFn: (data: AddBankAccountDto) =>
      bankAccountApi.addBankAccount(businessId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankAccounts", businessId] });
      setIsModalOpen(false);
    },
  });

  // Set default bank account mutation
  const setDefaultMutation = useMutation({
    mutationFn: (bankAccountId: string) =>
      bankAccountApi.setDefaultBankAccount(businessId!, bankAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankAccounts", businessId] });
      setSettingDefaultId(null);
    },
    onError: () => {
      setSettingDefaultId(null);
    },
  });

  // Remove bank account mutation
  const removeBankAccountMutation = useMutation({
    mutationFn: (bankAccountId: string) =>
      bankAccountApi.removeBankAccount(businessId!, bankAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankAccounts", businessId] });
      setRemovingId(null);
    },
    onError: () => {
      setRemovingId(null);
    },
  });

  const handleSetDefault = (bankAccountId: string) => {
    setSettingDefaultId(bankAccountId);
    setDefaultMutation.mutate(bankAccountId);
  };

  const handleRemove = (bankAccountId: string) => {
    if (
      window.confirm(
        "Are you sure you want to remove this bank account? This action cannot be undone."
      )
    ) {
      setRemovingId(bankAccountId);
      removeBankAccountMutation.mutate(bankAccountId);
    }
  };

  const handleAddBankAccount = (data: AddBankAccountDto) => {
    addBankAccountMutation.mutate(data);
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
              <button
                onClick={() => navigate("/")}
                className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Home
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Bank Accounts
              </h1>
              <p className="text-gray-600 mt-1">{business.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  navigate(`/bank-accounts/${businessId}/payout-schedule`)
                }
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Payout Schedule
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Bank Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {addBankAccountMutation.isError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error Adding Bank Account
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {addBankAccountMutation.error instanceof Error
                    ? addBankAccountMutation.error.message
                    : "Failed to add bank account. Please try again."}
                </p>
              </div>
            </div>
          </div>
        )}

        {setDefaultMutation.isError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error Setting Default
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Failed to set default bank account. Please try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {removeBankAccountMutation.isError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error Removing Bank Account
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {removeBankAccountMutation.error instanceof Error
                    ? removeBankAccountMutation.error.message
                    : "Failed to remove bank account. Please try again."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {bankAccountsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bank accounts...</p>
          </div>
        ) : bankAccountsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">
              Error loading bank accounts. Please try again.
            </p>
          </div>
        ) : bankAccounts && bankAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bankAccounts.map((bankAccount) => (
              <BankAccountCard
                key={bankAccount.id}
                bankAccount={bankAccount}
                onSetDefault={handleSetDefault}
                onRemove={handleRemove}
                isSettingDefault={settingDefaultId === bankAccount.id}
                isRemoving={removingId === bankAccount.id}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Bank Accounts
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first bank account to receive payouts.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Add Bank Account
            </button>
          </div>
        )}

        {/* Info Box */}
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
                About Bank Accounts
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Bank accounts are used to receive payouts from the platform.
                  You can add multiple bank accounts and set one as default. The
                  default account will be used for automatic payouts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Bank Modal */}
      <AddBankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddBankAccount}
        isAdding={addBankAccountMutation.isPending}
      />
    </div>
  );
};

export default BankAccountsPage;

