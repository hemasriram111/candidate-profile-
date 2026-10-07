import { Accordion } from '../common/Accordion'
import { SectionHeader } from '../common/SectionHeader'
import { mockFAQs } from '../../data/mock/mockFAQs'

export function FAQSection() {
  return (
    <section className="faq-section">
      <div className="container narrow-container">
        <SectionHeader
          eyebrow="Frequently asked questions"
          title="Everything you need to know about Clyptus"
          align="center"
        />
        <Accordion items={mockFAQs} />
      </div>
    </section>
  )
}
