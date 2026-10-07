import { SectionHeader } from '../../components/common/SectionHeader'
import { HowItWorksSection } from '../../components/sections/HowItWorksSection'
import { WhyClyptusSection } from '../../components/sections/WhyClyptusSection'

export function AboutPage() {
  return (
    <section className="page-shell">
      <div className="container">
        <div className="narrow-container">
          <SectionHeader eyebrow="About Clyptus" title="A clearer path to opportunity." description="This prototype explains the product direction for a modern career platform built to help professionals move with focus." />
        </div>
        <HowItWorksSection />
        <WhyClyptusSection />
        <div className="story-layout">
          <div className="story-card">
            <h3>What Clyptus is</h3>
            <p>Clyptus is a candidate-first career platform designed to match professionals with relevant opportunities while helping them build clarity around their direction.</p>
          </div>
          <div className="story-card">
            <h3>What problem it solves</h3>
            <p>Job search often feels noisy, fragmented and difficult to trust. Clyptus brings structure to that experience through clear matching and stronger career visibility.</p>
          </div>
          <div className="story-card">
            <h3>Candidate experience</h3>
            <p>We help candidates maintain one profile, discover roles that fit their needs, and stay informed about their applications and next steps.</p>
          </div>
          <div className="story-card">
            <h3>Technology and AI vision</h3>
            <p>Thoughtful AI can improve relevance, skill guidance and discovery without replacing the human side of career decisions.</p>
          </div>
          <div className="story-card">
            <h3>Career opportunity</h3>
            <p>Clyptus is built for professionals navigating growth, transition and ambition — whether they are early in their path or ready for a next chapter.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
