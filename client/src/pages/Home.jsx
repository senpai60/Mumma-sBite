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
    </main>
  )
}

export default Home