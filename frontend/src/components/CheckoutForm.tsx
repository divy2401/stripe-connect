import { useState, FormEvent } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface CheckoutFormProps {
  clientSecret: string;
  onBack: () => void;
}

export default function CheckoutForm({
  clientSecret: _clientSecret,
  onBack,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setMessage("Payment succeeded! 🎉");
      setIsLoading(false);
    } else {
      setMessage("Payment processing...");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {message && (
        <div
          className={`px-4 py-3 rounded-lg ${
            message.includes("succeeded")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isLoading || !stripe || !elements}
          className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isLoading ? "Processing..." : "Pay Now"}
        </button>
      </div>

      {message?.includes("succeeded") && (
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition"
        >
          Go to Home
        </button>
      )}
    </form>
  );
}
