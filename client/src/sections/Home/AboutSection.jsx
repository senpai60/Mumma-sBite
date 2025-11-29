export default function AboutSection() {
  return (
    <section className="bg-bg text-text px-4 py-14 sm:px-6 md:px-12">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        
        {/* LEFT: IMAGE BOX */}
        <div className="relative w-full h-[260px] sm:h-[330px] lg:h-[380px] overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] bg-surface border border-border">
          
          {/* main story image */}
          <img
            src="https://i.pinimg.com/1200x/35/2d/b6/352db660218d5de780ddac393dfe8f05.jpg"
            alt="Mumma's Bite kitchen"
            className="w-full h-full object-cover object-center opacity-[0.92]"
          />

          {/* decorative cookie PNG */}
          <img
            src="/images/elements/cookie-1.png"
            className="absolute -bottom-5 -left-5 h-20 sm:h-24 opacity-80 pointer-events-none select-none"
            alt=""
          />
        </div>

        {/* RIGHT: ABOUT CONTENT */}
        <div className="space-y-5 lg:space-y-6">
          <div className="space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl">
              Made With Love,  
              <span className="text-primary block">
                Straight From Mumma’s Kitchen
              </span>
            </h2>

            <p className="font-sans text-sm sm:text-base text-text-light leading-relaxed max-w-md">
              Mumma’s Bite started in a tiny home kitchen with one simple idea —
              <span className="text-text font-medium"> “taste that warms the heart.”</span>  
              Every chocolate we make is hand-crafted with care, balanced sweetness,
              and premium ingredients that remind you of home.
            </p>
          </div>

          <p className="font-sans text-sm sm:text-base text-text-light leading-relaxed max-w-md">
            Whether it's a late-night craving, a surprise gift, or a celebration,
            our recipes carry the same comfort and love that only mumma can give.
            No preservatives, no shortcuts — just pure, honest flavour.
          </p>

          {/* highlight chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 bg-accent-soft text-accent text-[0.7rem] font-medium rounded-[999px]">
              Handcrafted Daily
            </span>
            <span className="px-3 py-1 bg-primary-soft text-primary text-[0.7rem] font-medium rounded-[999px]">
              Zero Preservatives
            </span>
            <span className="px-3 py-1 bg-bg border border-border text-text-light text-[0.7rem] font-medium rounded-[999px]">
              Family Recipes
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
