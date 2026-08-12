import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import { useCartContext } from "../context/CartContext";
import LoaderPrimary from "../components/ui/LoaderPrimary";


function CartPage() {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    fetchCart,
    updateCartItem,
    deleteCartItem,
    clearCart,
  } = useCartContext();

  useEffect(() => {
    if (!cart) {
      fetchCart();
    }
  }, [cart]);

  const products = cart?.products || [];
  const subtotal = cart?.subtotal || 0;
  const gst = cart?.gst || 0;
  const deliveryFee = cart?.deliveryFee || 0;
  const total = cart?.total ?? cart?.grandTotal ?? 0;
  const totalItems = cart?.totalItems ?? products.length;

  const handleIncrement = (productId, currentQuantity) => {
    updateCartItem(productId, currentQuantity + 1);
  };

  const handleDecrement = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateCartItem(productId, currentQuantity - 1);
    }
  };

  const handleRemove = (productId) => {
    deleteCartItem(productId);
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    navigate("/payment");
  };

  const handleContinueShopping = () => {
    navigate("/");
  };

  return (
    <main className="bg-bg text-text min-h-[70vh] px-4 py-8 sm:px-6 md:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back / title */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleContinueShopping}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-text-light hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue browsing
          </button>

          {products.length > 0 && (
            <button
              onClick={handleClearCart}
              className="inline-flex items-center gap-1.5 text-xs text-text-light hover:text-accent transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Cart
            </button>
          )}
        </div>

        {loading && !cart ? (
          <div className="flex items-center justify-center py-24">
            <LoaderPrimary />
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Left: Items */}
            <div className="flex-1 space-y-3">
              <h1 className="font-display text-2xl sm:text-3xl">Your Cart</h1>
              <p className="font-sans text-xs sm:text-sm text-text-light mb-2">
                {products.length === 0
                  ? "Your cart is empty. Add some treats from Mumma's Bite!"
                  : `You have ${totalItems} item${
                      totalItems > 1 ? "s" : ""
                    } in your cart.`}
              </p>

              {products.length === 0 ? (
                <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8 text-center text-sm text-text-light space-y-3">
                  <p>
                    Start with our{" "}
                    <span className="font-medium text-primary">
                      Top Recipes of the Month
                    </span>{" "}
                    or browse categories to fill your cart.
                  </p>
                  <button
                    onClick={handleContinueShopping}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-white text-xs font-medium px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Explore Treats
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((item) => (
                    <CartItem
                      key={item._id || item.product?._id}
                      item={item}
                      onIncrement={handleIncrement}
                      onDecrement={handleDecrement}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Summary */}
            <div className="lg:w-[320px] xl:w-[360px] flex-shrink-0">
              <CartSummary
                subtotal={subtotal}
                gst={gst}
                deliveryFee={deliveryFee}
                total={total}
                onCheckout={handleCheckout}
                disabled={products.length === 0}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default CartPage;
