import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  payoutScheduleApi,
  businessApi,
  bankAccountApi,
  CreatePayoutScheduleDto,
} from "../../api/client";

const PayoutSchedulePage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scheduleType, setScheduleType] = useState<
    "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL" | "CUSTOM"
  >("MANUAL");
  const [rotationStrategy, setRotationStrategy] = useState<
    "ROUND_ROBIN" | "ALTERNATE_MONTHLY" | "ALTERNATE_WEEKLY" | "FIXED"
  >("ROUND_ROBIN");
  const [isEnabled, setIsEnabled] = useState(false);
  const [intervalDays, setIntervalDays] = useState<number>(7);
  const [specificDayOfWeek, setSpecificDayOfWeek] = useState<number>(1);
  const [specificDayOfMonth, setSpecificDayOfMonth] = useState<number>(1);
  const [minimumPayoutAmount, setMinimumPayoutAmount] = useState<number>(10);

  // Fetch business
  const { data: business } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessApi.getBusinessById(businessId!),
    enabled: !!businessId,
  });

  // Fetch bank accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ["bankAccounts", businessId],
    queryFn: () => bankAccountApi.getBankAccounts(businessId!),
    enabled: !!businessId,
  });

  // Fetch existing schedule
  const { data: existingSchedule } = useQuery({
    queryKey: ["payoutSchedule", businessId],
    queryFn: () => payoutScheduleApi.getSchedule(businessId!),
    enabled: !!businessId,
  });

  // Initialize form with existing schedule
  React.useEffect(() => {
    if (existingSchedule) {
      setScheduleType(existingSchedule.scheduleType);
      setRotationStrategy(existingSchedule.rotationStrategy);
      setIsEnabled(existingSchedule.isEnabled);
      setIntervalDays(existingSchedule.intervalDays || 7);
      setSpecificDayOfWeek(existingSchedule.specificDayOfWeek || 1);
      setSpecificDayOfMonth(existingSchedule.specificDayOfMonth || 1);
      setMinimumPayoutAmount(
        (existingSchedule.minimumPayoutAmount || 1000) / 100
      );
    }
  }, [existingSchedule]);

  // Create/Update schedule mutation
  const saveScheduleMutation = useMutation({
    mutationFn: (data: CreatePayoutScheduleDto) =>
      payoutScheduleApi.createOrUpdateSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payoutSchedule", businessId] });
      alert("Payout schedule saved successfully!");
    },
  });

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: () => payoutScheduleApi.processScheduledPayout(businessId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payoutSchedule", businessId] });
      queryClient.invalidateQueries({ queryKey: ["bankAccounts", businessId] });
      alert("Payout processed successfully!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessId) return;

    if (isEnabled && bankAccounts && bankAccounts.length < 2 && rotationStrategy !== "FIXED") {
      alert("You need at least 2 bank accounts for rotation strategies");
      return;
    }

    const data: CreatePayoutScheduleDto = {
      businessId,
      scheduleType,
      rotationStrategy,
      isEnabled,
      minimumPayoutAmount: minimumPayoutAmount * 100, // Convert to cents
    };

    if (scheduleType === "WEEKLY") {
      data.specificDayOfWeek = specificDayOfWeek;
    } else if (scheduleType === "MONTHLY") {
      data.specificDayOfMonth = specificDayOfMonth;
    } else if (scheduleType === "CUSTOM") {
      data.intervalDays = intervalDays;
    }

    saveScheduleMutation.mutate(data);
  };

  const handleProcessPayout = () => {
    if (window.confirm("Are you sure you want to process the scheduled payout now?")) {
      processPayoutMutation.mutate();
    }
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
                onClick={() => navigate(`/bank-accounts/${businessId}`)}
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
                Back to Bank Accounts
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Payout Schedule
              </h1>
              <p className="text-gray-600 mt-1">{business.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg
              className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <strong>About Payout Schedules:</strong> When enabled, Stripe's
              automatic daily payouts will be disabled. You can configure custom
              payout schedules with bank account rotation. Manual payouts will
              always be available regardless of schedule settings.
            </div>
          </div>
        </div>

        {/* Bank Accounts Info */}
        {bankAccounts && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Bank Accounts ({bankAccounts.length})
            </h3>
            <div className="space-y-1">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="text-sm text-gray-600 flex items-center gap-2"
                >
                  <span>
                    {account.bankName || "Bank"} •••• {account.last4}
                  </span>
                  {account.isDefault && (
                    <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
            {bankAccounts.length < 2 && rotationStrategy !== "FIXED" && (
              <p className="mt-2 text-sm text-yellow-600">
                ⚠️ Add at least 2 bank accounts to use rotation strategies
              </p>
            )}
          </div>
        )}

        {/* Schedule Status */}
        {existingSchedule && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Current Schedule Status
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span
                  className={`ml-2 font-medium ${
                    existingSchedule.isEnabled
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {existingSchedule.isEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              {existingSchedule.nextPayoutDate && (
                <div>
                  <span className="text-gray-600">Next Payout:</span>
                  <span className="ml-2 font-medium">
                    {new Date(
                      existingSchedule.nextPayoutDate
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
              {existingSchedule.lastPayoutDate && (
                <div>
                  <span className="text-gray-600">Last Payout:</span>
                  <span className="ml-2 font-medium">
                    {new Date(
                      existingSchedule.lastPayoutDate
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Rotation Count:</span>
                <span className="ml-2 font-medium">
                  {existingSchedule.rotationCounter}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Enable Payout Schedule
              </label>
              <p className="text-sm text-gray-500 mt-1">
                When enabled, automatic Stripe payouts will be disabled
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Type
            </label>
            <select
              value={scheduleType}
              onChange={(e) =>
                setScheduleType(
                  e.target.value as
                    | "DAILY"
                    | "WEEKLY"
                    | "MONTHLY"
                    | "MANUAL"
                    | "CUSTOM"
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!isEnabled}
            >
              <option value="MANUAL">Manual Only</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="CUSTOM">Custom Interval</option>
            </select>
          </div>

          {/* Schedule-specific options */}
          {isEnabled && scheduleType === "WEEKLY" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of Week
              </label>
              <select
                value={specificDayOfWeek}
                onChange={(e) => setSpecificDayOfWeek(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          )}

          {isEnabled && scheduleType === "MONTHLY" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of Month (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={specificDayOfMonth}
                onChange={(e) =>
                  setSpecificDayOfMonth(Number(e.target.value))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {isEnabled && scheduleType === "CUSTOM" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interval (Days)
              </label>
              <input
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Rotation Strategy */}
          {isEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Rotation Strategy
              </label>
              <select
                value={rotationStrategy}
                onChange={(e) =>
                  setRotationStrategy(
                    e.target.value as
                      | "ROUND_ROBIN"
                      | "ALTERNATE_MONTHLY"
                      | "ALTERNATE_WEEKLY"
                      | "FIXED"
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="FIXED">Fixed (Use Default Account)</option>
                <option value="ROUND_ROBIN">Round Robin (Cycle Through)</option>
                <option value="ALTERNATE_MONTHLY">
                  Alternate Monthly
                </option>
                <option value="ALTERNATE_WEEKLY">Alternate Weekly</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {rotationStrategy === "FIXED" &&
                  "Always uses the default bank account"}
                {rotationStrategy === "ROUND_ROBIN" &&
                  "Cycles through all bank accounts in order"}
                {rotationStrategy === "ALTERNATE_MONTHLY" &&
                  "Alternates between accounts each month"}
                {rotationStrategy === "ALTERNATE_WEEKLY" &&
                  "Alternates between accounts each week"}
              </p>
            </div>
          )}

          {/* Minimum Payout Amount */}
          {isEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Payout Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minimumPayoutAmount}
                onChange={(e) =>
                  setMinimumPayoutAmount(Number(e.target.value))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Payouts will only be processed if balance exceeds this amount
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {existingSchedule && existingSchedule.isEnabled && (
              <button
                type="button"
                onClick={handleProcessPayout}
                disabled={processPayoutMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition disabled:opacity-50"
              >
                {processPayoutMutation.isPending
                  ? "Processing..."
                  : "Process Payout Now"}
              </button>
            )}
            <button
              type="submit"
              disabled={saveScheduleMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayoutSchedulePage;

