import AboutSection from "../sections/Home/AboutSection"
import CategoriesSection from "../sections/Home/CategoriesSection"
import Hero from "../sections/Home/Hero"
import MarqueeHighlights from "../sections/Home/MarqueeHighlights"
import TestimonialSection from "../sections/Home/TestinomalSection"
import TopRecipesSection from "../sections/Home/TopRecipesSection"

function Home() {
  return (
    <main className="w-full min-h-screen bg-bg text-text font-display">
        <Hero/>
        <MarqueeHighlights/>
        <TopRecipesSection/>
        <TestimonialSection/>
        <CategoriesSection/>
        <AboutSection/>
    </main>
  )
}

export default Home