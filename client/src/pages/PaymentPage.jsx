import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Check,
  CheckCircle,
} from "lucide-react";
import { useCartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import LoaderPrimary from "../components/ui/LoaderPrimary";
import { orderApi } from "../api/orderApi";

const BASE =
  import.meta.env.VITE_SERVER_URI ||
  (import.meta.env.PROD ? "" : "http://localhost:3000");

function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, loading, clearCart } = useCartContext();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [otpState, setOtpState] = useState({
    step: null, // null | "otp" | "verified"
    otpCode: "",
    otpError: "",
    otpLoading: false,
    mobileVerified: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!cart || cart.total === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ""))) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required";
    } else if (!/^\d{6}$/.test(formData.zipCode.replace(/\D/g, ""))) {
      newErrors.zipCode = "Enter a valid 6-digit ZIP code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const verifyPayment = async (response, orderId) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      response;
    try {
      const res = await orderApi.post("/verify", {
        razorpayOrderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (res.data.isVerified) {
        await clearCart();
        navigate(`/orders/${orderId}`);
      } else {
        alert("Payment verification failed.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      alert("Payment verification failed.");
    }
  };

  const handleSendOtp = async () => {
    if (!formData.mobile.trim()) {
      setOtpState((prev) => ({
        ...prev,
        otpError: "Mobile number is required",
      }));
      return;
    }

    const digits = formData.mobile.replace(/\D/g, "");
    if (digits.length !== 10) {
      setOtpState((prev) => ({
        ...prev,
        otpError: "Enter a valid 10-digit mobile number",
      }));
      return;
    }

    setOtpState((prev) => ({
      ...prev,
      otpLoading: true,
      otpError: "",
    }));

    try {
      await user.sendOtp?.(digits);
      setOtpState((prev) => ({
        ...prev,
        step: "otp",
        otpCode: "",
      }));
    } catch (err) {
      setOtpState((prev) => ({
        ...prev,
        otpError:
          err?.response?.data?.message || "Failed to send OTP. Try again.",
      }));
    } finally {
      setOtpState((prev) => ({
        ...prev,
        otpLoading: false,
      }));
    }
  };

  const handleVerifyOtp = async () => {
    if (otpState.otpCode.length !== 6) {
      setOtpState((prev) => ({
        ...prev,
        otpError: "Enter the 6-digit OTP",
      }));
      return;
    }

    setOtpState((prev) => ({
      ...prev,
      otpLoading: true,
      otpError: "",
    }));

    try {
      await user.verifyOtp?.(
        formData.mobile.replace(/\D/g, ""),
        otpState.otpCode,
        formData.fullName
      );
      setOtpState((prev) => ({
        ...prev,
        step: "verified",
        mobileVerified: true,
      }));
      setSuccessMessage("Mobile number verified successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setOtpState((prev) => ({
        ...prev,
        otpError: err?.response?.data?.message || "Invalid OTP. Try again.",
      }));
    } finally {
      setOtpState((prev) => ({
        ...prev,
        otpLoading: false,
      }));
    }
  };

  const handleOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (!otpState.mobileVerified) {
      alert("Please verify your mobile number first");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await orderApi.post("/create-order", {
        cartId: cart?._id,
        deliveryDetails: formData,
      });

      const { order, key_id, orderId, order_id } = res.data;
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || key_id;

      const options = {
        key: razorpayKeyId,
        amount: order?.amount || res.data.amount,
        currency: order?.currency || res.data.currency || "INR",
        name: "Mumma's Bite",
        description: "Food Order Payment",
        order_id: order_id || order?.id,
        prefill: {
          name: formData.fullName,
          email: user?.email || "",
          contact: formData.mobile,
        },
        theme: {
          color: "#e07b67",
        },
        handler: (response) => verifyPayment(response, orderId || order_id || order?.id),
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            console.log("Razorpay checkout modal dismissed by user");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        console.error("Razorpay Payment Failed:", response.error);
        setIsSubmitting(false);
        alert(`Payment Failed: ${response.error.description || "Transaction failed"}`);
      });
      rzp.open();
    } catch (error) {
      console.error("Order error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        "An error occurred while placing your order.";
      alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoaderPrimary />;
  }

  const subtotal = cart?.subtotal || 0;
  const gst = cart?.gst || 0;
  const deliveryFee = cart?.deliveryFee || 0;
  const total = cart?.total ?? cart?.grandTotal ?? 0;

  return (
    <main className="bg-bg text-text min-h-screen px-4 py-8 sm:px-6 md:px-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => navigate("/cart")}
            className="inline-flex items-center gap-2 text-sm text-text-light hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </button>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl text-text mb-2">
          Confirm Your Order
        </h1>
        <p className="text-text-light text-sm">
          Please provide your details to complete the delivery
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information Section */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)]">
              <h2 className="font-display text-xl text-text mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`w-full rounded-lg px-4 py-2.5 bg-bg border transition focus:outline-none focus:ring-1 ${
                      errors.fullName
                        ? "border-red-400 focus:ring-red-300"
                        : "border-border focus:border-primary focus:ring-primary/60"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Mobile Number <span className="text-primary">*</span>
                  </label>
                  <div
                    className={`flex gap-2 rounded-lg bg-bg border transition focus-within:border-primary focus-within:ring-1 ${
                      errors.mobile
                        ? "border-red-400 focus-within:ring-red-300"
                        : "border-border focus-within:ring-primary/60"
                    }`}
                  >
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      disabled={otpState.mobileVerified}
                      className="flex-1 px-4 py-2.5 bg-transparent outline-none text-sm disabled:opacity-60"
                    />
                    {!otpState.mobileVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpState.otpLoading || formData.mobile.length < 10}
                        className="px-4 py-2.5 text-primary text-sm font-medium hover:opacity-80 disabled:opacity-50 transition"
                      >
                        {otpState.otpLoading ? "Sending..." : "Send OTP"}
                      </button>
                    )}
                    {otpState.mobileVerified && (
                      <div className="px-4 py-2.5 flex items-center gap-2 text-green-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </div>
                    )}
                  </div>
                  {errors.mobile && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.mobile}
                    </p>
                  )}

                  {/* OTP Input */}
                  {otpState.step === "otp" && !otpState.mobileVerified && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={otpState.otpCode}
                        onChange={(e) =>
                          setOtpState((prev) => ({
                            ...prev,
                            otpCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                          }))
                        }
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        className="w-full rounded-lg px-4 py-2.5 bg-bg border border-border focus:border-primary focus:ring-1 focus:ring-primary/60 outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpState.otpLoading || otpState.otpCode.length < 6}
                        className="w-full px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                      >
                        {otpState.otpLoading ? "Verifying..." : "Verify OTP"}
                      </button>
                      {otpState.otpError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {otpState.otpError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)]">
              <h2 className="font-display text-xl text-text mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Address
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Street Address <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House number, street name, etc."
                    className={`w-full rounded-lg px-4 py-2.5 bg-bg border transition focus:outline-none focus:ring-1 ${
                      errors.address
                        ? "border-red-400 focus:ring-red-300"
                        : "border-border focus:border-primary focus:ring-primary/60"
                    }`}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      City <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className={`w-full rounded-lg px-4 py-2.5 bg-bg border transition focus:outline-none focus:ring-1 ${
                        errors.city
                          ? "border-red-400 focus:ring-red-300"
                          : "border-border focus:border-primary focus:ring-primary/60"
                      }`}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      State <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className={`w-full rounded-lg px-4 py-2.5 bg-bg border transition focus:outline-none focus:ring-1 ${
                        errors.state
                          ? "border-red-400 focus:ring-red-300"
                          : "border-border focus:border-primary focus:ring-primary/60"
                      }`}
                    />
                    {errors.state && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.state}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    ZIP Code <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="6-digit PIN code"
                    maxLength="6"
                    className={`w-full rounded-lg px-4 py-2.5 bg-bg border transition focus:outline-none focus:ring-1 ${
                      errors.zipCode
                        ? "border-red-400 focus:ring-red-300"
                        : "border-border focus:border-primary focus:ring-primary/60"
                    }`}
                  />
                  {errors.zipCode && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.zipCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] sticky top-8">
              <h3 className="font-display text-lg text-text mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm text-text-light mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-text font-medium">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="text-text font-medium">₹{gst}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-text font-medium">
                    {deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}
                  </span>
                </div>
              </div>

              <hr className="border-border my-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-medium text-text">Grand Total</span>
                <span className="font-display text-2xl text-primary">
                  ₹{total}
                </span>
              </div>

              <button
                onClick={handleOrder}
                disabled={
                  isSubmitting ||
                  !otpState.mobileVerified ||
                  Object.keys(errors).length > 0
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-medium px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    Place Order
                  </>
                )}
              </button>

              <p className="mt-3 text-[0.7rem] text-text-light text-center">
                {!otpState.mobileVerified
                  ? "Please verify your mobile number first"
                  : "You will be redirected to payment gateway"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default PaymentPage;
