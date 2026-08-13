import { useState } from "react";
import { createRazorpayOrder, verifyRazorpayPayment } from "../api/orderApi";

/**
 * Reusable Razorpay Standard Checkout Button Component
 *
 * @param {Object} props
 * @param {number} props.amount - Amount in paise (minimum 100 paise = ₹1)
 * @param {string} [props.currency="INR"] - Currency code
 * @param {string} [props.receipt] - Receipt ID
 * @param {string} [props.buttonText="Pay with Razorpay"] - Button text
 * @param {string} [props.className] - Custom button styles
 * @param {Function} [props.onSuccess] - Callback on payment success (payload)
 * @param {Function} [props.onError] - Callback on payment error
 */
export default function RazorpayCheckoutButton({
  amount = 100,
  currency = "INR",
  receipt,
  buttonText = "Pay with Razorpay",
  className = "",
  onSuccess,
  onError,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      if (amount < 100) {
        throw new Error("Amount must be at least 100 paise (₹1)");
      }

      // Step 1: Create Order on Backend
      const orderData = await createRazorpayOrder({
        amount,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      });

      const keyId =
        import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.key_id;
      const orderId = orderData.order_id || orderData.id;

      // Step 2: Open Razorpay Modal
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Mumma's Bite",
        description: "Payment",
        order_id: orderId,
        handler: async (response) => {
          try {
            // Step 3: Verify Payment Signature on Backend
            const verification = await verifyRazorpayPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verification.isVerified) {
              if (onSuccess) {
                onSuccess(response, verification);
              }
            } else {
              const err = new Error("Payment signature verification failed");
              setError(err.message);
              if (onError) onError(err);
            }
          } catch (verr) {
            console.error("Verification error:", verr);
            setError("Payment verification failed");
            if (onError) onError(verr);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            const err = new Error("Payment checkout cancelled by user");
            setError("Payment cancelled by user");
            if (onError) onError(err);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        console.error("Payment failed:", resp.error);
        setLoading(false);
        const err = new Error(
          resp.error.description || "Payment process failed"
        );
        setError(err.message);
        if (onError) onError(err);
      });

      rzp.open();
    } catch (err) {
      console.error("Razorpay checkout error:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to start checkout";
      setError(msg);
      if (onError) onError(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={
          className ||
          "bg-primary hover:opacity-90 text-white font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
        }
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </>
        ) : (
          buttonText
        )}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
