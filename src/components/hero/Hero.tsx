import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

import { HeroSearch } from './HeroSearch'
import { HeroVisual } from './HeroVisual'

export function Hero() {
  const navigate = useNavigate()

  return (
    <section className="hero-section">
      <div className="container hero-layout">
        <div className="hero-copy">
          <span className="eyebrow">Hiring now</span>
          <h1>Find a role that matches the work you actually want.</h1>
          <p>
            Search product, engineering, data and operations jobs with real salary ranges, team details and hiring context.
          </p>

          <div className="hero-actions">
            <Button type="button" className="h-11 px-5 text-sm" onClick={() => navigate('/jobs')}>
              Browse jobs <ArrowRight size={16} />
            </Button>
            <Button type="button" variant="outline" className="h-11 px-5 text-sm" onClick={() => navigate('/register')}>
              Create profile
            </Button>
          </div>

          <HeroSearch />
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}
