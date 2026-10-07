import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type AccordionItem = {
  id: string
  question: string
  answer: string
}

type AccordionProps = {
  items: AccordionItem[]
}

export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  return (
    <div className="accordion-list">
      {items.map((item) => {
        const isOpen = openId === item.id
        return (
          <div key={item.id} className={`accordion-item ${isOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="accordion-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
            >
              <span>{item.question}</span>
              <ChevronDown size={18} />
            </button>
            <div className="accordion-panel" aria-hidden={!isOpen}>
              <p>{item.answer}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
