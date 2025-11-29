import CategoryCard from "../../components/layout/CategoryCard";

const categories = [
  {
    id: 1,
    title: "Handmade Chocolates",
    description: "Soft-centered, nutty, dark, milk – sab yahan. Perfect for everyday cravings.",
    badge: "Most Loved",
    image:
      "https://images.pexels.com/photos/4109992/pexels-photo-4109992.jpeg",
  },
  {
    id: 2,
    title: "Brownies & Bars",
    description: "Gooey, fudgy, crispy top brownies – weekend binge ke liye ideal.",
    badge: "Bestseller",
    image:
      "https://images.pexels.com/photos/4109993/pexels-photo-4109993.jpeg",
  },
  {
    id: 3,
    title: "Gift Hampers",
    description: "Curated boxes with chocolates, notes and more. Ready-to-gift options.",
    badge: "Perfect for gifting",
    image:
      "https://images.pexels.com/photos/4110000/pexels-photo-4110000.jpeg",
  },
  {
    id: 4,
    title: "Cookies & Bites",
    description: "Crispy, chewy, nutty – har mood ke liye ek cookie.",
    image:
      "https://images.pexels.com/photos/8275138/pexels-photo-8275138.jpeg",
  },
  {
    id: 5,
    title: "Dark Collection",
    description: "High cocoa %, low sugar. Bitter-sweet lovers ke liye special range.",
    image:
      "https://images.pexels.com/photos/461431/pexels-photo-461431.jpeg",
  },
  {
    id: 6,
    title: "Custom Boxes",
    description: "Mix & match your favourites and add a personal note inside.",
    badge: "Build your own",
    image:
      "https://images.pexels.com/photos/918328/pexels-photo-918328.jpeg",
  },
];

export default function CategoriesSection() {
  return (
    <section className="bg-bg text-text px-4 py-10 sm:px-6 md:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-text">
              Explore by Category
            </h2>
            <p className="font-sans text-xs sm:text-sm text-text-light max-w-md">
              Whether you’re gifting, celebrating, or just craving – start with a category
              that matches your mood.
            </p>
          </div>
          <span className="text-[0.7rem] sm:text-xs font-medium text-text-light bg-surface border border-border px-3 py-1 rounded-full self-start">
            Handcrafted in small batches · Fresh daily
          </span>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} {...cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
