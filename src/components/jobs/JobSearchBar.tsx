import { Search, SlidersHorizontal } from 'lucide-react'

type JobSearchBarProps = {
  query: string
  location: string
  onQueryChange: (value: string) => void
  onLocationChange: (value: string) => void
  onSearch: () => void
  onToggleFilters?: () => void
}

export function JobSearchBar({ query, location, onQueryChange, onLocationChange, onSearch, onToggleFilters }: JobSearchBarProps) {
  const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSearch()
    }
  }

  return (
    <div className="job-search-bar">
      <label className="search-input compact">
        <Search size={16} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} onKeyDown={handleEnter} placeholder="Job title / skills" aria-label="Job title or skills" />
      </label>

      <label className="search-input compact">
        <Search size={16} />
        <input value={location} onChange={(event) => onLocationChange(event.target.value)} onKeyDown={handleEnter} placeholder="Location" aria-label="Location" />
      </label>

      <button type="button" className="button button-primary" onClick={onSearch}>Search</button>
      {onToggleFilters && (
        <button type="button" className="button button-secondary mobile-filter-button" onClick={onToggleFilters}>
          <SlidersHorizontal size={15} /> Filters
        </button>
      )}
    </div>
  )
}
