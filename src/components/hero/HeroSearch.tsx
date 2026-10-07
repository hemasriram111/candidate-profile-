import { MapPin, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const popularSearches = ['AI Engineer', 'Python Developer', 'Java Developer', 'Data Analyst', 'Frontend Developer', 'Cloud Engineer']

export function HeroSearch() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()

  const handleSubmit = () => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('query', keyword.trim())
    if (location.trim()) params.set('location', location.trim())
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="hero-search-wrap">
      <div className="hero-search" role="search">
        <label className="search-input search-keyword">
          <Search size={16} />
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Job title, skills or keywords"
            aria-label="Job title, skills or keywords"
          />
        </label>

        <label className="search-input search-location">
          <MapPin size={16} />
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Location"
            aria-label="Location"
          />
        </label>

        <button type="button" className="button button-primary hero-search-button" onClick={handleSubmit}>
          Search Jobs
        </button>
      </div>

      <div className="popular-searches" aria-label="Popular searches">
        <span className="popular-label">
          <Sparkles size={14} /> Popular searches
        </span>
        <div className="search-tags">
          {popularSearches.map((term) => (
            <button key={term} type="button" className="tag-button" onClick={() => setKeyword(term)}>
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
