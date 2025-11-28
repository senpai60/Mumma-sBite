import {
  BadgeCheck,
  Leaf,
  Truck,
  Gift,
  Milk,
  HeartHandshake,
} from "lucide-react";

const points = [
  {
    label: "100% Handmade Chocolates",
    Icon: BadgeCheck,
  },
  {
    label: "No Preservatives Added",
    Icon: Leaf,
  },
  {
    label: "Same-day Delivery in City",
    Icon: Truck,
  },
  {
    label: "Custom Gift Boxes Available",
    Icon: Gift,
  },
  {
    label: "Premium Quality Ingredients",
    Icon: Milk,
  },
  {
    label: "Packed with Mumma’s Love",
    Icon: HeartHandshake,
  },
];

function MarqueeHighlights() {
  return (
    <section className="bg-surface border-y border-border py-3">
      <div className="max-w-6xl mx-auto overflow-hidden">
        <div className="mumma-marquee-track">
          {[...points, ...points].map(({ label, Icon }, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-2 text-[0.75rem] sm:text-sm font-medium text-text-light px-3 py-1 rounded-[999px] bg-bg border border-border shadow-[0_4px_14px_rgba(0,0,0,0.06)] whitespace-nowrap"
            >
              <Icon className="w-4 h-4 text-accent" strokeWidth={1.8} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MarqueeHighlights;
