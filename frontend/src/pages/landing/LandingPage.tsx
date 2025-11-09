import { Hero } from './components/Hero'
import { ArchitectureSection } from './components/ArchitectureSection'

export function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Hero />
      <ArchitectureSection />
    </div>
  )
}

