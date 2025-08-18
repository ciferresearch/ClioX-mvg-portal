import HeroSection from './HeroSection'
import BenefitsSection from './BenefitsSection'
import StakeholdersSection from './StakeholdersSection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <BenefitsSection />
      <StakeholdersSection />
    </div>
  )
}
