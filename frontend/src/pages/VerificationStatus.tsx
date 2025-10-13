import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  businessApi,
  VerificationStatus as VerificationStatusEnum,
} from "../api/client";

const VerificationStatus: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  // Fetch verification status with polling
  const {
    data: statusData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["verification-status", businessId],
    queryFn: () => businessApi.getVerificationStatus(businessId!),
    enabled: !!businessId,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const getStatusColor = (status: VerificationStatusEnum) => {
    switch (status) {
      case VerificationStatusEnum.VERIFIED:
        return "bg-green-100 text-green-800";
      case VerificationStatusEnum.IN_REVIEW:
        return "bg-yellow-100 text-yellow-800";
      case VerificationStatusEnum.REJECTED:
        return "bg-red-100 text-red-800";
      case VerificationStatusEnum.PENDING:
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: VerificationStatusEnum) => {
    switch (status) {
      case VerificationStatusEnum.VERIFIED:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case VerificationStatusEnum.IN_REVIEW:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case VerificationStatusEnum.REJECTED:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case VerificationStatusEnum.PENDING:
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getStatusMessage = (status: VerificationStatusEnum) => {
    switch (status) {
      case VerificationStatusEnum.VERIFIED:
        return "Your business account has been verified and is ready to accept payments!";
      case VerificationStatusEnum.IN_REVIEW:
        return "Your verification is being reviewed by our team. This usually takes 1-2 business days.";
      case VerificationStatusEnum.REJECTED:
        return "Your verification was rejected. Please check the requirements below and resubmit.";
      case VerificationStatusEnum.PENDING:
      default:
        return "Please complete the verification process to start accepting payments.";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (error || !statusData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Status
          </h1>
          <p className="text-gray-600 mb-4">
            Unable to load verification status.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const {
    business,
    verificationStatus,
    charges_enabled,
    payouts_enabled,
    requirements,
  } = statusData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verification Status
          </h1>
          <p className="text-gray-600">
            Account verification for <strong>{business.name}</strong>
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(verificationStatus)}`}
            >
              {getStatusIcon(verificationStatus)}
              <span className="ml-2">
                {verificationStatus.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-lg text-gray-700">
              {getStatusMessage(verificationStatus)}
            </p>
          </div>

          {/* Capabilities Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${charges_enabled ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Card Payments
                </h3>
              </div>
              <p className="text-gray-600">
                {charges_enabled ? "Enabled" : "Disabled"} -{" "}
                {charges_enabled
                  ? "Can accept card payments"
                  : "Cannot accept card payments"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${payouts_enabled ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
                <h3 className="text-lg font-semibold text-gray-900">Payouts</h3>
              </div>
              <p className="text-gray-600">
                {payouts_enabled ? "Enabled" : "Disabled"} -{" "}
                {payouts_enabled
                  ? "Can receive payouts"
                  : "Cannot receive payouts"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {verificationStatus === VerificationStatusEnum.PENDING && (
              <button
                onClick={() => navigate(`/verify/${businessId}`)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
              >
                Start Verification
              </button>
            )}

            {verificationStatus === VerificationStatusEnum.REJECTED && (
              <button
                onClick={() => navigate(`/verify/${businessId}`)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
              >
                Resubmit Verification
              </button>
            )}

            <button
              onClick={() => navigate("/")}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Requirements Details */}
        {(requirements.currently_due.length > 0 ||
          requirements.eventually_due.length > 0 ||
          requirements.past_due.length > 0) && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Verification Requirements
            </h2>

            {requirements.past_due.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-red-600 mb-3">
                  Past Due
                </h3>
                <ul className="space-y-2">
                  {requirements.past_due.map((requirement, index) => (
                    <li key={index} className="flex items-center text-red-600">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {requirement
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {requirements.currently_due.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-yellow-600 mb-3">
                  Currently Due
                </h3>
                <ul className="space-y-2">
                  {requirements.currently_due.map((requirement, index) => (
                    <li
                      key={index}
                      className="flex items-center text-yellow-600"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {requirement
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {requirements.eventually_due.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-blue-600 mb-3">
                  Eventually Due
                </h3>
                <ul className="space-y-2">
                  {requirements.eventually_due.map((requirement, index) => (
                    <li key={index} className="flex items-center text-blue-600">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {requirement
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {requirements.disabled_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  Account Disabled
                </h3>
                <p className="text-red-700">{requirements.disabled_reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Auto-refresh Notice */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            This page automatically refreshes every 5 seconds to show the latest
            status.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationStatus;
