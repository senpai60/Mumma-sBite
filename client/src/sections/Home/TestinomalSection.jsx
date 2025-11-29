// src/components/sections/TestimonialSection.jsx
import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Aditi Sharma",
    role: "Friday treat regular",
    text: "Mumma’s Bite wale chocolates literally ghar jaise lagte hain. Soft, fresh and not overly sweet – exactly how I like it.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1533777419517-3e4017e2e15a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // big image url
  },
  {
    id: 2,
    name: "Rohan Mehta",
    role: "Gifting made easy",
    text: "Custom gift box order kiya tha – packaging, taste, timing… sab kuch on point tha. Ab har occasion pe yahin se leta hoon.",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1606818195176-da30290999af?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    name: "Neha & Ankit",
    role: "Late-night dessert people",
    text: "Brownies + truffles combo has become our weekend ritual. Dark collection is insane if you love bitter-sweet chocolate.",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1614387726083-c445e799102b?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

function RatingStars({ value }) {
  return (
    <div className="inline-flex items-center gap-1 text-[0.7rem] text-text-light">
      <Star className="h-3 w-3 text-accent" fill="currentColor" />
      <span>{value.toFixed(1)} · Loved by regulars</span>
    </div>
  );
}

function ImageTestimonialCard({ data, tall = false }) {
  const { name, role, text, rating, image } = data;

  return (
    <div
      className={`
        relative overflow-hidden rounded-[var(--radius-card)]
        bg-surface border border-border shadow-[var(--shadow-soft)]
        ${tall ? "h-full" : "h-full"}
      `}
    >
      {/* big background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />

      {/* gradient so text readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/60 to-bg/20" />

      {/* content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-5">
        <p className="font-sans text-sm text-text-light max-w-[90%]">
          {text}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm sm:text-base text-text">
              {name}
            </p>
            <p className="font-sans text-[0.7rem] text-text-light">
              {role}
            </p>
          </div>
          <RatingStars value={rating} />
        </div>
      </div>
    </div>
  );
}

export default function TestimonialSection() {
  const [t1, t2, t3] = testimonials;

  return (
    <section className="bg-bg text-text px-4 py-10 sm:px-6 md:px-12">
      <div className="mx-auto max-w-6xl space-y-6 lg:space-y-8 lg:min-h-screen flex flex-col">
        {/* Heading */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-text">
              What People Are Saying
            </h2>
            <p className="font-sans text-xs sm:text-sm text-text-light max-w-md">
              Regulars, gifters, midnight snackers – sabka honest feedback ek jagah.
            </p>
          </div>
          <span className="text-[0.7rem] sm:text-xs font-medium text-text-light bg-surface border border-border px-3 py-1 rounded-full self-start">
            4.9★ average · Mumma-approved
          </span>
        </div>

        {/* Layout area – grows to fill height */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left column: 2 stacked cards using full height */}
          <div className="sm:col-span-2 flex flex-col gap-4 sm:gap-6">
            <div className="flex-1 min-h-[180px] sm:min-h-[220px] lg:min-h-0">
              <ImageTestimonialCard data={t1} />
            </div>
            <div className="flex-1 min-h-[180px] sm:min-h-[220px] lg:min-h-0">
              <ImageTestimonialCard data={t2} />
            </div>
          </div>

          {/* Right column: one tall card filling entire column */}
          <div className="sm:col-span-1 h-[260px] sm:h-auto sm:min-h-full">
            <ImageTestimonialCard data={t3} tall />
          </div>
        </div>
      </div>
    </section>
  );
}
