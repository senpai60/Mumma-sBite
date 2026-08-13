import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Home,
  Trash2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import LoaderPrimary from "../components/ui/LoaderPrimary";
import { orderApi } from "../api/orderApi";

const STATUS_CONFIG = {
  PLACED: {
    label: "Order Placed",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Your order has been placed successfully",
  },
  PROCESSING: {
    label: "Processing",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description: "We are preparing your order",
  },
  SHIPPED: {
    label: "Shipped",
    icon: Truck,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    description: "Your order is on the way",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    description: "Your order has been delivered",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    description: "This order has been cancelled",
  },
};

const StatusTimeline = ({ status }) => {
  const statuses = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentIndex = statuses.indexOf(status);

  return (
    <div className="space-y-4">
      {statuses.map((s, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const config = STATUS_CONFIG[s];
        const Icon = config.icon;

        return (
          <div key={s} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition ${
                  isCompleted
                    ? `${config.bgColor} ${config.borderColor}`
                    : "border-border bg-bg"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isCompleted ? config.color : "text-text-light"}`}
                  strokeWidth={2}
                />
              </div>
              {index < statuses.length - 1 && (
                <div
                  className={`w-1 h-8 mt-2 ${
                    isCompleted ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
            <div className="pb-6">
              <p
                className={`font-semibold ${
                  isCompleted ? "text-text" : "text-text-light"
                }`}
              >
                {config.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-text-light mt-1">
                  {config.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function OrderDetailsPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await orderApi.get(`/${orderId}`);
        setOrder(response.data.order);
      } catch (err) {
        const resp = err?.response?.data || {};
        setError(resp.message || "Failed to fetch order");
        // capture debug fields if server returned them (non-prod)
        if (resp.requestedBy || resp.orderOwner) {
          setDebugInfo({ requestedBy: resp.requestedBy, orderOwner: resp.orderOwner });
        } else {
          setDebugInfo(null);
        }
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setCancelLoading(true);
    try {
      const response = await orderApi.post(`/${orderId}/cancel`);
      setOrder(response.data.order);
      alert("Order cancelled successfully");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelLoading(false);
    }
  };

  const canCancelOrder =
    order && ["PLACED", "PROCESSING"].includes(order.status);

  if (loading) {
    return <LoaderPrimary />;
  }

  if (error || !order) {
    return (
      <main className="bg-bg text-text min-h-screen px-4 py-8 sm:px-6 md:px-12">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate("/orders")}
            className="inline-flex items-center gap-2 text-sm text-text-light hover:text-primary transition-colors cursor-pointer mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error || "Order not found"}</p>
            {debugInfo && (
              <div className="mt-3 text-xs text-red-600">
                <p>Debug: requestedBy = {debugInfo.requestedBy}</p>
                <p>Debug: orderOwner = {debugInfo.orderOwner}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PLACED;
  const StatusIcon = config.icon;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const deliveryDetails = order.deliveryDetails || {};
  const totalPrice = order.products.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );
  const gst = Math.round(totalPrice * 0.05);
  const deliveryFee = 50;
  const grandTotal = totalPrice + gst + deliveryFee;

  return (
    <main className="bg-bg text-text min-h-screen px-4 py-8 sm:px-6 md:px-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => navigate("/orders")}
            className="inline-flex items-center gap-2 text-sm text-text-light hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </button>
        </div>

        {/* Status Banner */}
        <div
          className={`${config.bgColor} border-2 ${config.borderColor} rounded-[var(--radius-card)] p-6`}
        >
          <div className="flex items-center gap-3 mb-3">
            <StatusIcon className={`h-6 w-6 ${config.color}`} />
            <div>
              <p className={`font-semibold ${config.color}`}>
                {config.label}
              </p>
              <p className="text-sm text-text-light">{orderDate}</p>
            </div>
          </div>
          <p className="text-sm text-text">Order #{order.razorpayOrderId?.slice(-8).toUpperCase()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            {order.status !== "CANCELLED" && (
              <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
                <h3 className="font-display text-lg text-text mb-6">
                  Order Status
                </h3>
                <StatusTimeline status={order.status} />
              </div>
            )}

            {/* Products */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
              <h3 className="font-display text-lg text-text mb-4">
                Order Items
              </h3>

              <div className="space-y-3">
                {order.products.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 pb-4 border-b border-border last:border-b-0"
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-text">{product.name}</p>
                      <p className="text-xs text-text-light">
                        Qty: {product.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text">
                        ₹{product.price * product.quantity}
                      </p>
                      <p className="text-xs text-text-light">
                        ₹{product.price} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
              <h3 className="font-display text-lg text-text mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Details
              </h3>

              <div className="space-y-4">
                {deliveryDetails.fullName && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-text-light mt-1" />
                    <div>
                      <p className="text-xs text-text-light">Name</p>
                      <p className="font-medium text-text">
                        {deliveryDetails.fullName}
                      </p>
                    </div>
                  </div>
                )}

                {deliveryDetails.mobile && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-text-light mt-1" />
                    <div>
                      <p className="text-xs text-text-light">Mobile</p>
                      <p className="font-medium text-text">
                        {deliveryDetails.mobile}
                      </p>
                    </div>
                  </div>
                )}

                {deliveryDetails.address && (
                  <div className="flex items-start gap-3">
                    <Home className="h-4 w-4 text-text-light mt-1" />
                    <div>
                      <p className="text-xs text-text-light">Address</p>
                      <p className="font-medium text-text">
                        {deliveryDetails.address}, {deliveryDetails.city},{" "}
                        {deliveryDetails.state} - {deliveryDetails.zipCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Price Summary */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 sticky top-8">
              <h3 className="font-display text-lg text-text mb-4">
                Price Summary
              </h3>

              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-text-light">Subtotal</span>
                  <span className="font-medium text-text">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light">GST (5%)</span>
                  <span className="font-medium text-text">₹{gst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light">Delivery</span>
                  <span className="font-medium text-text">₹{deliveryFee}</span>
                </div>
              </div>

              <hr className="border-border my-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-medium text-text">Total</span>
                <span className="font-display text-2xl text-primary">
                  ₹{grandTotal}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => navigate("/")}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition"
                >
                  <Package className="h-4 w-4" />
                  Explore More
                </button>

                {canCancelOrder && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-text text-sm font-medium hover:bg-bg disabled:opacity-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    {cancelLoading ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>

              <div className="mt-4 p-3 bg-accent-soft rounded-lg">
                <p className="text-xs text-text-light">
                  <span className="font-medium">Payment Status:</span>{" "}
                  {order.paymentStatus || "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default OrderDetailsPage;
