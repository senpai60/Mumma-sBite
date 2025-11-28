import { useEffect, useState } from "react";

const heroImages = [
  "https://i.pinimg.com/1200x/7d/6f/d8/7d6fd855cf63d627942d1e4bf31eac3e.jpg",
  "https://i.pinimg.com/1200x/c4/07/cb/c407cb83c361857b12a970ddfc7e5318.jpg",
  "https://i.pinimg.com/1200x/a2/54/ab/a254ab3176f62d952a39db1c7a2a6a2b.jpg",
];

function Hero() {
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => {
        return (prev + 1) % heroImages.length;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-bg text-text min-h-[70vh] flex items-center px-6 py-12 md:px-12">
      <div className="max-w-xl space-y-4">
        <span className="inline-flex items-center gap-2 px-4 py-1 rounded-[var(--radius-pill)] bg-accent-soft text-accent text-xs font-medium">
          🍫 Handmade with Love · Since 2025
        </span>

        <h1 className="font-display text-4xl md:text-5xl leading-tight">
          Mumma&apos;s Bite:
          <span className="block text-primary">
            Handmade Chocolates & Bakes
          </span>
        </h1>

        <p className="font-sans text-text-light text-sm md:text-base max-w-md">
          Soft-centered chocolates, fresh-baked goodies, and gift boxes that
          feel like a warm hug from mumma.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button className="px-6 py-3 rounded-xl bg-primary text-white font-medium shadow-[var(--shadow-soft)]">
            Order Signature Box
          </button>
          <button className="px-6 py-3 rounded-xl bg-primary-soft text-primary font-medium border border-border">
            View Today&apos;s Specials
          </button>
        </div>
      </div>

      {/* right side image box placeholder */}
      <div className="hidden md:flex flex-1 justify-end">
        <div className="bg-surface rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-soft)] w-80 h-80">
          {/* later: product image grid / hero image */}
          <img
            src={heroImages[heroImageIndex]}
            alt=""
            className="w-full h-full object-center object-cover rounded-[var(--radius-card)]"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
