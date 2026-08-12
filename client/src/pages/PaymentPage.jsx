import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, User, Phone, MapPin, AlertCircle, Check } from "lucide-react";
import { useCartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import LoaderPrimary from "../components/ui/LoaderPrimary";

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cart, loading } = useCartContext();
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Show alert instead of Razorpay integration
      const orderDetails = `
Order Confirmation Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${formData.fullName}
Mobile: ${formData.mobile}
Address: ${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}

Order Total: ₹${cart.total}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for your order! Your order has been placed successfully.`;

      alert(orderDetails);

      // Reset form and navigate
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Order error:", error);
      alert("An error occurred while placing your order. Please try again.");
    } finally {
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
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    className={`w-full rounded-lg px-4 py-2.5 bg-bg border transition focus:outline-none focus:ring-1 ${
                      errors.mobile
                        ? "border-red-400 focus:ring-red-300"
                        : "border-border focus:border-primary focus:ring-primary/60"
                    }`}
                  />
                  {errors.mobile && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.mobile}
                    </p>
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
              <h3 className="font-display text-lg text-text mb-4">Order Summary</h3>

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
                disabled={isSubmitting}
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
                Your order details will be confirmed on the next step
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default PaymentPage;
