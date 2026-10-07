import { BriefcaseBusiness, MapPin } from 'lucide-react'

import teamDiscussionImage from '../../assets/team disscution.png'

export function HeroVisual() {
  return (
    <div className="hero-visual" aria-label="Team discussion on hiring">
      <img src={teamDiscussionImage} alt="Team discussion on hiring" className="hero-team-image" />
      <div className="floating-match-panel">
        <div className="match-score-header">
          <span>Open roles</span>
          <span className="score-pill">41</span>
        </div>

        <div className="match-role-row">
          <div className="mini-avatar">P</div>
          <div>
            <strong>Product roles</strong>
            <p>Remote + hybrid</p>
          </div>
        </div>

        <div className="panel-meta">
          <span><MapPin size={12} /> Bengaluru</span>
          <span><BriefcaseBusiness size={12} /> Product</span>
        </div>
      </div>
    </div>
  )
}
