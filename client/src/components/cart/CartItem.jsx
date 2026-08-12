import { Minus, Plus, Trash2 } from "lucide-react";

function CartItem({ item, onIncrement, onDecrement, onRemove }) {
  const prod = item.product || {};
  const productId = prod._id || item.id;
  const title = prod.title || item.title || "Product";
  const description = prod.description || item.note || "";
  const tag = (prod.tags && prod.tags[0]) || item.tag || null;
  const price = prod.price ?? item.price ?? 0;
  const lineTotal = item.lineTotal ?? (price * item.quantity);

  const IMAGEKIT_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || "";
  const rawImage = prod.imageUrl || item.image || "";
  const displayImage =
    rawImage && !rawImage.startsWith("http") && IMAGEKIT_ENDPOINT
      ? `${IMAGEKIT_ENDPOINT.replace(/\/$/, "")}/${rawImage.replace(/^\//, "")}`
      : rawImage;

  return (
    <div className="flex gap-3 sm:gap-4 bg-surface border border-border rounded-[var(--radius-card)] p-3 sm:p-4">
      {/* Image */}
      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-bg border border-border flex-shrink-0">
        {displayImage ? (
          <img
            src={displayImage}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-surface flex items-center justify-center text-xs text-text-light">
            No Image
          </div>
        )}
      </div>

      {/* Info + controls */}
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-display text-sm sm:text-base text-text">
              {title}
            </h3>
            {description && (
              <p className="font-sans text-[0.7rem] sm:text-xs text-text-light line-clamp-2">
                {description}
              </p>
            )}
            {tag && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-soft text-accent text-[0.6rem] font-medium">
                {tag}
              </span>
            )}
          </div>

          <button
            onClick={() => onRemove(productId)}
            className="text-text-light hover:text-accent transition-colors cursor-pointer"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity */}
          <div className="inline-flex items-center gap-2 rounded-full bg-bg border border-border px-2 py-1">
            <button
              onClick={() => onDecrement(productId, item.quantity)}
              disabled={item.quantity <= 1}
              className="p-1 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="h-3 w-3" strokeWidth={1.8} />
            </button>
            <span className="min-w-[1.5rem] text-center text-xs font-medium text-text">
              {item.quantity}
            </span>
            <button
              onClick={() => onIncrement(productId, item.quantity)}
              className="p-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" strokeWidth={1.8} />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm sm:text-base font-semibold text-text">
              ₹{lineTotal}
            </p>
            <p className="text-[0.7rem] text-text-light">
              ₹{price} each
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
