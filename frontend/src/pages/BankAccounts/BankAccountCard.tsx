import React from "react";
import { BankAccount } from "../../api/client";

interface BankAccountCardProps {
  bankAccount: BankAccount;
  onSetDefault: (bankAccountId: string) => void;
  onRemove: (bankAccountId: string) => void;
  isSettingDefault?: boolean;
  isRemoving?: boolean;
}

const BankAccountCard: React.FC<BankAccountCardProps> = ({
  bankAccount,
  onSetDefault,
  onRemove,
  isSettingDefault = false,
  isRemoving = false,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border-2 ${
        bankAccount.isDefault ? "border-indigo-500" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-indigo-600"
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
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {bankAccount.bankName || "Bank Account"}
              </h3>
              <p className="text-sm text-gray-600">
                •••• {bankAccount.last4} • {bankAccount.currency.toUpperCase()}
              </p>
            </div>
          </div>

          {bankAccount.isDefault && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Default Payout Account
            </span>
          )}

          {bankAccount.status && (
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  bankAccount.status === "verified"
                    ? "bg-green-100 text-green-800"
                    : bankAccount.status === "new"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {bankAccount.status}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {!bankAccount.isDefault && (
            <button
              onClick={() => onSetDefault(bankAccount.id)}
              disabled={isSettingDefault}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSettingDefault ? "Setting..." : "Set as Default"}
            </button>
          )}
          <button
            onClick={() => onRemove(bankAccount.id)}
            disabled={isRemoving || bankAccount.isDefault}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              bankAccount.isDefault
                ? "Cannot remove default account. Set another as default first."
                : "Remove bank account"
            }
          >
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankAccountCard;

