import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";

const initialCart = [
  {
    id: 1,
    title: "Hazelnut Crunch Chocolates",
    note: "Box of 12 · Gift wrap included",
    tag: "Top Recipe",
    price: 399,
    quantity: 1,
    image: "https://images.pexels.com/photos/4109992/pexels-photo-4109992.jpeg",
  },
  {
    id: 2,
    title: "Classic Fudge Brownies",
    note: "Pack of 6 · Extra gooey",
    tag: "Best Seller",
    price: 349,
    quantity: 2,
    image: "https://images.pexels.com/photos/4109993/pexels-photo-4109993.jpeg",
  },
];

function CartPage() {
  const [cart, setCart] = useState(initialCart);

  const subtotal = useMemo(
    () =>
      cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  const deliveryFee = cart.length > 0 ? 49 : 0; // demo
  const discount = subtotal > 1000 ? 100 : 0; // demo rule

  const handleIncrement = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecrement = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handleRemove = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    // later: navigate to /checkout etc.
    console.log("Proceeding to checkout with:", cart);
    alert("Checkout flow not wired yet, this is just UI 😊");
  };

  const handleContinueShopping = () => {
    // later: navigate to /menu or /
    console.log("Go back to products");
  };

  return (
    <main className="bg-bg text-text min-h-[70vh] px-4 py-8 sm:px-6 md:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back / title */}
        <button
          onClick={handleContinueShopping}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-text-light hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue browsing
        </button>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left: Items */}
          <div className="flex-1 space-y-3">
            <h1 className="font-display text-2xl sm:text-3xl">
              Your Cart
            </h1>
            <p className="font-sans text-xs sm:text-sm text-text-light mb-2">
              {cart.length === 0
                ? "Your cart is empty. Add some treats from Mumma's Bite!"
                : `You have ${cart.length} item${
                    cart.length > 1 ? "s" : ""
                  } in your cart.`}
            </p>

            {cart.length === 0 ? (
              <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 text-center text-sm text-text-light">
                Start with our{" "}
                <span className="font-medium text-primary">
                  Top Recipes of the Month
                </span>{" "}
                or browse categories to fill your cart.
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <CartItem
                    key={item.id}
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
              deliveryFee={deliveryFee}
              discount={discount}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default CartPage;
