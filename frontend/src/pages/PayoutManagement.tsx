import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payoutApi, businessApi } from "../api/client";

export default function PayoutManagement() {
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutReason, setPayoutReason] = useState("");

  const queryClient = useQueryClient();

  const { data: businesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessApi.getAllBusinesses,
  });

  const { data: platformBalance } = useQuery({
    queryKey: ["platformBalance"],
    queryFn: payoutApi.getPlatformBalance,
  });

  const { data: businessBalance, refetch: refetchBusinessBalance } = useQuery({
    queryKey: ["businessBalance", selectedBusinessId],
    queryFn: () => payoutApi.getBusinessBalance(selectedBusinessId),
    enabled: !!selectedBusinessId,
  });

  const { data: payoutHistory } = useQuery({
    queryKey: ["payoutHistory", selectedBusinessId],
    queryFn: () => payoutApi.getPayoutHistory(selectedBusinessId),
    enabled: !!selectedBusinessId,
  });

  const createPayoutMutation = useMutation({
    mutationFn: payoutApi.createPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessBalance"] });
      queryClient.invalidateQueries({ queryKey: ["platformBalance"] });
      queryClient.invalidateQueries({ queryKey: ["payoutHistory"] });
      setPayoutAmount("");
      setPayoutReason("");
    },
  });

  const processWeeklyPayoutsMutation = useMutation({
    mutationFn: payoutApi.processWeeklyPayouts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessBalance"] });
      queryClient.invalidateQueries({ queryKey: ["platformBalance"] });
      queryClient.invalidateQueries({ queryKey: ["payoutHistory"] });
    },
  });

  const handleCreatePayout = () => {
    if (!selectedBusinessId) return;

    const amount = payoutAmount
      ? Math.round(parseFloat(payoutAmount) * 100)
      : undefined;

    createPayoutMutation.mutate({
      businessId: selectedBusinessId,
      amount,
      reason: payoutReason || undefined,
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏦 Payout Management
        </h1>
        <p className="text-gray-600">
          Manage payouts for businesses using the platform-collected payment
          flow
        </p>
      </div>

      {/* Platform Balance Overview */}
      {platformBalance && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Platform Balance Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">
                Total Collected
              </h3>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(platformBalance.totalCollected)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">
                Total Paid Out
              </h3>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(platformBalance.totalPaidOut)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">
                Platform Balance
              </h3>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(platformBalance.platformBalance)}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-orange-800">
                Pending Payouts
              </h3>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(platformBalance.pendingPayouts)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Payouts */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Weekly Payouts
        </h2>
        <p className="text-gray-600 mb-4">
          Process weekly payouts for all businesses with pending balances
        </p>
        <button
          onClick={() => processWeeklyPayoutsMutation.mutate()}
          disabled={processWeeklyPayoutsMutation.isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {processWeeklyPayoutsMutation.isPending
            ? "Processing..."
            : "Process Weekly Payouts"}
        </button>

        {processWeeklyPayoutsMutation.data && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              Weekly Payout Results
            </h3>
            <p className="text-green-700">
              Processed {processWeeklyPayoutsMutation.data.processed} payouts
              totaling{" "}
              {formatCurrency(processWeeklyPayoutsMutation.data.totalAmount)}
            </p>
          </div>
        )}
      </div>

      {/* Individual Business Payouts */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Individual Business Payouts
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Selection and Payout Form */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Business
              </label>
              <select
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a business...</option>
                {businesses?.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name} ({business.email})
                  </option>
                ))}
              </select>
            </div>

            {businessBalance && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Business Balance
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Total Collected:</strong>{" "}
                    {formatCurrency(businessBalance.totalCollected)}
                  </p>
                  <p>
                    <strong>Total Paid Out:</strong>{" "}
                    {formatCurrency(businessBalance.totalPaidOut)}
                  </p>
                  <p>
                    <strong>Pending Balance:</strong>{" "}
                    {formatCurrency(businessBalance.pendingBalance)}
                  </p>
                  <p>
                    <strong>Platform Fee (10%):</strong>{" "}
                    {formatCurrency(businessBalance.platformFee)}
                  </p>
                  <p className="font-semibold text-green-600">
                    <strong>Net Amount Available:</strong>{" "}
                    {formatCurrency(businessBalance.netAmount)}
                  </p>
                </div>
              </div>
            )}

            {selectedBusinessId &&
              businessBalance &&
              businessBalance.netAmount > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payout Amount (leave empty for full amount)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder={`Max: ${formatCurrency(businessBalance.netAmount)}`}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      value={payoutReason}
                      onChange={(e) => setPayoutReason(e.target.value)}
                      placeholder="e.g., Weekly payout, On-demand payout"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleCreatePayout}
                    disabled={createPayoutMutation.isPending}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {createPayoutMutation.isPending
                      ? "Processing..."
                      : "Create Payout"}
                  </button>
                </div>
              )}
          </div>

          {/* Payout History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Payout History</h3>
            {payoutHistory && payoutHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {payoutHistory.map((payout) => (
                  <div
                    key={payout.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(payout.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </p>
                        {payout.reason && (
                          <p className="text-sm text-gray-500">
                            {payout.reason}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          payout.status === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payout.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {selectedBusinessId
                  ? "No payout history found"
                  : "Select a business to view payout history"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Flow Explanation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Platform-Collected Payment Flow
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center">
              <span className="mr-2">1️⃣</span> Payment Collection
            </h3>
            <p className="text-green-800 text-sm">
              Customer pays $100 → Platform receives $100 (no automatic
              transfer)
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <span className="mr-2">2️⃣</span> Fee Calculation
            </h3>
            <p className="text-blue-800 text-sm">
              Platform keeps 10% ($10) → Business owed $90
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
              <span className="mr-2">3️⃣</span> Payout Management
            </h3>
            <p className="text-purple-800 text-sm">
              Platform transfers $90 to business (weekly or on-demand)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
