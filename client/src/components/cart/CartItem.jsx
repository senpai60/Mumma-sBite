import { Minus, Plus, Trash2 } from "lucide-react";

function CartItem({ item, onIncrement, onDecrement, onRemove }) {
  return (
    <div className="flex gap-3 sm:gap-4 bg-surface border border-border rounded-[var(--radius-card)] p-3 sm:p-4">
      {/* Image */}
      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-bg border border-border flex-shrink-0">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info + controls */}
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-display text-sm sm:text-base text-text">
              {item.title}
            </h3>
            {item.note && (
              <p className="font-sans text-[0.7rem] sm:text-xs text-text-light">
                {item.note}
              </p>
            )}
            {item.tag && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-soft text-accent text-[0.6rem] font-medium">
                {item.tag}
              </span>
            )}
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="text-text-light hover:text-accent transition-colors"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity */}
          <div className="inline-flex items-center gap-2 rounded-full bg-bg border border-border px-2 py-1">
            <button
              onClick={() => onDecrement(item.id)}
              disabled={item.quantity <= 1}
              className="p-1 disabled:opacity-40"
            >
              <Minus className="h-3 w-3" strokeWidth={1.8} />
            </button>
            <span className="min-w-[1.5rem] text-center text-xs font-medium text-text">
              {item.quantity}
            </span>
            <button onClick={() => onIncrement(item.id)} className="p-1">
              <Plus className="h-3 w-3" strokeWidth={1.8} />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm sm:text-base font-semibold text-text">
              ₹{item.price * item.quantity}
            </p>
            <p className="text-[0.7rem] text-text-light">
              ₹{item.price} each
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
