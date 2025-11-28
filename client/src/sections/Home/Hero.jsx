import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { ShoppingBag } from "lucide-react";

const heroImages = [
  "https://i.pinimg.com/1200x/7d/6f/d8/7d6fd855cf63d627942d1e4bf31eac3e.jpg",
  "https://i.pinimg.com/1200x/c4/07/cb/c407cb83c361857b12a970ddfc7e5318.jpg",
  "https://i.pinimg.com/1200x/a2/54/ab/a254ab3176f62d952a39db1c7a2a6a2b.jpg",
];

gsap.registerPlugin(useGSAP);

function Hero() {
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const imgRef = useRef(null);
  const prevIndexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => {
        prevIndexRef.current = prev;
        return (prev + 1) % heroImages.length;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useGSAP(
    () => {
      const direction =
        heroImageIndex > prevIndexRef.current ||
        (heroImageIndex === 0 && prevIndexRef.current === heroImages.length - 1)
          ? 1
          : -1;

      gsap.fromTo(
        imgRef.current,
        {
          autoAlpha: 0,
          x: 40 * direction,
          scale: 1.02,
        },
        {
          autoAlpha: 1,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
        }
      );
    },
    { dependencies: [heroImageIndex] }
  );

  return (
    <section className="bg-bg text-text px-4 py-10 sm:px-6 md:px-12 lg:py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 md:flex-row md:items-center">
        {/* LEFT: TEXT */}
        <div className="w-full max-w-xl space-y-4 text-center md:text-left">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-[var(--radius-pill)] bg-accent-soft text-accent text-[0.7rem] sm:text-xs font-medium">
            🍫 Handmade with Love · Since 2025
          </span>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">
            Mumma&apos;s Bite:
            <span className="block text-primary">
              Handmade Chocolates &amp; Bakes
            </span>
          </h1>

          <p className="font-sans text-text-light text-sm sm:text-base max-w-md mx-auto md:mx-0">
            Soft-centered chocolates, fresh-baked goodies, and gift boxes that
            feel like a warm hug from mumma.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
            <button className="px-6 py-3 rounded-xl bg-primary text-white font-medium shadow-[var(--shadow-soft)] inline-flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" strokeWidth={1.8} />
              Order Signature Box
            </button>
            <button className="px-6 py-3 rounded-xl bg-primary-soft text-primary font-medium border border-border w-full sm:w-auto">
              View Today&apos;s Specials
            </button>
          </div>
        </div>

        {/* RIGHT: IMAGE */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex justify-center md:justify-end md:flex-1">
          <div className="bg-surface rounded-[var(--radius-card)] p-3 sm:p-4 shadow-[var(--shadow-soft)] w-full aspect-square overflow-hidden">
            <img
              ref={imgRef}
              src={heroImages[heroImageIndex]}
              alt="Mumma's Bite handmade chocolate"
              className="w-full h-full object-center object-cover rounded-[var(--radius-card)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
