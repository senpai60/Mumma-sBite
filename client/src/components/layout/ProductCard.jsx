// src/components/ProductCard.jsx
import { Heart, ShoppingBag, Star } from "lucide-react";

function ProductCard({
  title,
  description,
  price,
  image,
  tag,
  rating = 4.8,
}) {
  return (
    <div className="group bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-soft)] flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {tag && (
          <span className="absolute left-3 top-3 rounded-[999px] bg-accent-soft text-accent text-[0.65rem] font-medium px-2 py-1">
            {tag}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
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
          </div>
          <button
            aria-label="Add to favourites"
            className="shrink-0 rounded-full border border-border bg-bg p-1.5 text-text-light hover:text-accent hover:border-accent transition-colors"
          >
            <Heart className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base text-text">
              ₹{price}
            </span>
            <span className="inline-flex items-center gap-1 text-[0.7rem] text-text-light">
              <Star className="h-3 w-3 text-accent" fill="currentColor" />
              {rating.toFixed(1)} · Chef’s pick
            </span>
          </div>

          <button className="inline-flex items-center gap-1 rounded-lg bg-primary text-white text-[0.7rem] sm:text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity">
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.8} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
