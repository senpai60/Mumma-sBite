import { ArrowRight } from "lucide-react";

function CategoryCard({ title, description, image, badge }) {
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-soft)] flex flex-col justify-between">
      {/* Background image */}
      {image && (
        <div
          className="absolute inset-0 bg-bg bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-500"
          // style={{ backgroundImage: `url(${image})` }}
        />
      )}

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/60 to-bg/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4 sm:p-5 gap-3">
        <div className="space-y-2 max-w-[90%]">
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-soft text-accent text-[0.65rem] font-medium">
              {badge}
            </span>
          )}
          <h3 className="font-display text-lg text-text">
            {title}
          </h3>
          {description && (
            <p className="font-sans text-xs sm:text-sm text-text-light">
              {description}
            </p>
          )}
        </div>

        <button
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-primary mt-1
                     group-hover:gap-2 transition-all"
          type="button"
        >
          Explore {title}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default CategoryCard;
