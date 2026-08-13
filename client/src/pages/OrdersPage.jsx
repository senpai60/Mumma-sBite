import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronRight,
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
  },
  PROCESSING: {
    label: "Processing",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  SHIPPED: {
    label: "Shipped",
    icon: Truck,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

const StatusLine = ({ currentStatus }) => {
  const statuses = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-2 mt-3">
      {statuses.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={status} className="flex items-center flex-1">
            <div
              className={`h-2 rounded-full transition-all ${
                isCompleted ? "bg-primary" : "bg-border"
              }`}
              style={{
                width: isCurrent ? "20px" : "100%",
              }}
            />
            {index < statuses.length - 1 && (
              <div
                className={`h-1 flex-1 transition-all ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await orderApi.get("/user");
        setOrders(response.data.orders || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch orders");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <LoaderPrimary />;
  }

  return (
    <main className="bg-bg text-text min-h-screen px-4 py-8 sm:px-6 md:px-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm text-text-light hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>

        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-text mb-2">
            My Orders
          </h1>
          <p className="text-text-light text-sm">
            {orders.length} {orders.length === 1 ? "order" : "orders"} found
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-12 text-center">
            <Package className="h-12 w-12 text-text-light mx-auto mb-3 opacity-50" />
            <h3 className="font-display text-lg text-text mb-2">
              No orders yet
            </h3>
            <p className="text-text-light text-sm mb-6">
              Start browsing our menu and place your first order!
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PLACED;
              const StatusIcon = config.icon;
              const orderDate = new Date(order.createdAt).toLocaleDateString(
                "en-IN",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              );

              return (
                <div
                  key={order._id}
                  className={`bg-surface border-2 ${config.borderColor} rounded-[var(--radius-card)] p-5 hover:shadow-[var(--shadow-soft)] transition cursor-pointer`}
                  onClick={() => navigate(`/orders/${order._id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 mt-1`}
                      >
                        <StatusIcon
                          className={`h-5 w-5 ${config.color}`}
                          strokeWidth={1.5}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-text">
                            Order #{order.razorpayOrderId?.slice(-8).toUpperCase()}
                          </h3>
                          <span
                            className={`${config.color} text-xs font-semibold px-2 py-1 rounded-full ${config.bgColor}`}
                          >
                            {config.label}
                          </span>
                        </div>

                        <p className="text-xs text-text-light mb-3">
                          {orderDate} • {order.products.length} item
                          {order.products.length > 1 ? "s" : ""}
                        </p>

                        {/* Status Progress Line */}
                        {order.status !== "CANCELLED" && (
                          <StatusLine currentStatus={order.status} />
                        )}

                        <div className="flex gap-4 mt-3 text-xs">
                          <div>
                            <p className="text-text-light">Amount</p>
                            <p className="font-semibold text-text">
                              ₹{order.amount}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-light">Payment</p>
                            <p className="font-semibold text-text">
                              {order.paymentStatus === "PAID"
                                ? "Paid"
                                : order.paymentStatus}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-text-light flex-shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default OrdersPage;
