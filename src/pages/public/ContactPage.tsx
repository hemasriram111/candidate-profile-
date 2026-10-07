import { useState } from 'react'
import { SectionHeader } from '../../components/common/SectionHeader'

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="page-shell">
      <div className="container contact-layout">
        <div>
          <SectionHeader eyebrow="Contact Clyptus" title="We’re here to help." description="Reach out for support, general enquiries and candidate questions." />
          <div className="contact-details">
            <div>
              <h3>Support</h3>
              <p>support@clyptus.example</p>
            </div>
            <div>
              <h3>General enquiries</h3>
              <p>hello@clyptus.example</p>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input type="text" name="name" placeholder="Your name" />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" placeholder="you@example.com" />
          </label>
          <label>
            <span>Subject</span>
            <input type="text" name="subject" placeholder="How can we help?" />
          </label>
          <label>
            <span>Message</span>
            <textarea name="message" rows={5} placeholder="Tell us more..." />
          </label>
          <button type="submit" className="button button-primary">Send Message</button>
          {submitted && <p className="success-note">Your message has been queued for review in prototype mode.</p>}
        </form>
      </div>
    </section>
  )
}
