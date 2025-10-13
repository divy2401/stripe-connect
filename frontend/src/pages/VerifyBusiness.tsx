import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  businessApi,
  VerifyBusinessDto,
  BusinessType,
  RepresentativeInfo,
  BankInfo,
  VerificationMethod,
} from "../api/client";

const VerifyBusiness: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] =
    useState<VerificationMethod | null>(null);
  const [formData, setFormData] = useState<VerifyBusinessDto>({
    businessName: "",
    businessType: BusinessType.COMPANY,
    taxId: "",
    representativeInfo: {
      firstName: "",
      lastName: "",
      dobDay: 1,
      dobMonth: 1,
      dobYear: 1990,
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
    },
    bankInfo: {
      accountNumber: "",
      routingNumber: "",
      accountHolderName: "",
      bankName: "",
    },
  });

  // Fetch business details
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessApi.getBusinessById(businessId!),
    enabled: !!businessId,
  });

  // Verify business mutation
  const verifyMutation = useMutation({
    mutationFn: (data: VerifyBusinessDto) =>
      businessApi.verifyBusiness(businessId!, data),
    onSuccess: () => {
      navigate(`/verification-status/${businessId}`);
    },
    onError: (error: any) => {
      console.error("Verification failed:", error);
    },
  });

  const handleInputChange = (
    section: keyof VerifyBusinessDto,
    _field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: value,
    }));
  };

  const handleRepresentativeChange = (
    field: keyof RepresentativeInfo,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      representativeInfo: {
        ...prev.representativeInfo,
        [field]: value,
      },
    }));
  };

  const handleBankChange = (field: keyof BankInfo, value: any) => {
    setFormData((prev) => ({
      ...prev,
      bankInfo: {
        ...prev.bankInfo,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate(formData);
  };

  const handleMethodSelection = (method: VerificationMethod) => {
    setSelectedMethod(method);
    if (method === VerificationMethod.EMBEDDED_ONBOARDING) {
      navigate(`/onboarding/${businessId}`);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (businessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading business details...</p>
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
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verify Business Account
          </h1>
          <p className="text-gray-600">
            Complete the verification process for{" "}
            <strong>{business.name}</strong>
          </p>
        </div>

        {/* Verification Method Selection */}
        {!selectedMethod && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Choose Verification Method
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custom Form Option */}
                <div
                  onClick={() =>
                    handleMethodSelection(VerificationMethod.CUSTOM_FORM)
                  }
                  className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Custom Form
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Fill out our custom verification form with all required
                      business and personal information.
                    </p>
                    <div className="text-xs text-gray-500">
                      <p>✓ Full control over data collection</p>
                      <p>✓ Custom UI/UX</p>
                      <p>✓ Step-by-step process</p>
                    </div>
                  </div>
                </div>

                {/* Embedded Onboarding Option */}
                <div
                  onClick={() =>
                    handleMethodSelection(
                      VerificationMethod.EMBEDDED_ONBOARDING
                    )
                  }
                  className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-purple-500 hover:shadow-md transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Stripe Embedded Onboarding
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Use Stripe's secure, pre-built verification form embedded
                      directly in our platform.
                    </p>
                    <div className="text-xs text-gray-500">
                      <p>✓ Stripe-managed security</p>
                      <p>✓ Automatic compliance</p>
                      <p>✓ Faster verification</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Form - Only show when custom form is selected */}
        {selectedMethod === VerificationMethod.CUSTOM_FORM && (
          <>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep >= step
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        currentStep >= step
                          ? "text-indigo-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step === 1 && "Business Info"}
                      {step === 2 && "Representative"}
                      {step === 3 && "Bank Details"}
                    </span>
                    {step < 3 && (
                      <div
                        className={`w-8 h-0.5 ml-4 ${
                          currentStep > step ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              {/* Step 1: Business Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Business Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) =>
                        handleInputChange("businessName", "", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>

                    <input
                      type="text"
                      value={formData.businessType}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />

                    {/* <select
                      value={formData.businessType}
                      onChange={(e) =>
                        handleInputChange(
                          "businessType",
                          "",
                          e.target.value as BusinessType
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={BusinessType.COMPANY}>Company</option>
                      <option value={BusinessType.INDIVIDUAL}>
                        Individual
                      </option>
                    </select> */}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) =>
                        handleInputChange("taxId", "", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="EIN or SSN"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Representative Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Representative Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.representativeInfo.firstName}
                        onChange={(e) =>
                          handleRepresentativeChange(
                            "firstName",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.representativeInfo.lastName}
                        onChange={(e) =>
                          handleRepresentativeChange("lastName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <select
                        value={formData.representativeInfo.dobMonth}
                        onChange={(e) =>
                          handleRepresentativeChange(
                            "dobMonth",
                            parseInt(e.target.value)
                          )
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString("default", {
                              month: "long",
                            })}
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.representativeInfo.dobDay}
                        onChange={(e) =>
                          handleRepresentativeChange(
                            "dobDay",
                            parseInt(e.target.value)
                          )
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.representativeInfo.dobYear}
                        onChange={(e) =>
                          handleRepresentativeChange(
                            "dobYear",
                            parseInt(e.target.value)
                          )
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        {Array.from({ length: 100 }, (_, i) => (
                          <option key={i + 1924} value={i + 1924}>
                            {i + 1924}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.representativeInfo.email}
                        onChange={(e) =>
                          handleRepresentativeChange("email", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.representativeInfo.phone}
                        onChange={(e) =>
                          handleRepresentativeChange("phone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={formData.representativeInfo.addressLine1}
                      onChange={(e) =>
                        handleRepresentativeChange(
                          "addressLine1",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.representativeInfo.addressLine2}
                      onChange={(e) =>
                        handleRepresentativeChange(
                          "addressLine2",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.representativeInfo.city}
                        onChange={(e) =>
                          handleRepresentativeChange("city", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.representativeInfo.state}
                        onChange={(e) =>
                          handleRepresentativeChange("state", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.representativeInfo.postalCode}
                        onChange={(e) =>
                          handleRepresentativeChange(
                            "postalCode",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={formData.representativeInfo.country}
                      onChange={(e) =>
                        handleRepresentativeChange("country", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Bank Information */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Bank Account Information
                  </h2>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Security Notice
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Your bank account information is encrypted and
                            securely transmitted to Stripe. We never store your
                            full account number.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={formData.bankInfo.accountHolderName}
                      onChange={(e) =>
                        handleBankChange("accountHolderName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Name on bank account"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.bankInfo.bankName}
                      onChange={(e) =>
                        handleBankChange("bankName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Your bank name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      value={formData.bankInfo.routingNumber}
                      onChange={(e) =>
                        handleBankChange("routingNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="9-digit routing number"
                      maxLength={9}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.bankInfo.accountNumber}
                      onChange={(e) =>
                        handleBankChange("accountNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Account number"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    currentStep === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={verifyMutation.isPending}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  >
                    {verifyMutation.isPending
                      ? "Submitting..."
                      : "Submit Verification"}
                  </button>
                )}
              </div>

              {/* Error Message */}
              {verifyMutation.isError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Verification Failed
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          There was an error submitting your verification.
                          Please try again.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyBusiness;
