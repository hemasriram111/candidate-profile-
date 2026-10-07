type JobFiltersProps = {
  locationFilter: string
  experienceFilter: string
  salaryFilter: string
  onLocationChange: (value: string) => void
  onExperienceChange: (value: string) => void
  onSalaryChange: (value: string) => void
}

export function JobFilters({
  locationFilter,
  experienceFilter,
  salaryFilter,
  onLocationChange,
  onExperienceChange,
  onSalaryChange,
}: JobFiltersProps) {
  return (
    <aside className="job-filters">
      <div className="filter-group">
        <label>
          <span>Location</span>
          <input value={locationFilter} onChange={(event) => onLocationChange(event.target.value)} placeholder="Any location" />
        </label>
      </div>
      <div className="filter-group">
        <label>
          <span>Experience</span>
          <select value={experienceFilter} onChange={(event) => onExperienceChange(event.target.value)}>
            <option value="">Any</option>
            <option value="1-3 years">1-3 years</option>
            <option value="2-4 years">2-4 years</option>
            <option value="3-5 years">3-5 years</option>
            <option value="5+ years">5+ years</option>
          </select>
        </label>
      </div>
      <div className="filter-group">
        <label>
          <span>Salary</span>
          <select value={salaryFilter} onChange={(event) => onSalaryChange(event.target.value)}>
            <option value="">Any</option>
            <option value="₹7L - ₹12L">₹7L - ₹12L</option>
            <option value="₹8L - ₹14L">₹8L - ₹14L</option>
            <option value="₹14L - ₹24L">₹14L - ₹24L</option>
            <option value="₹18L - ₹30L">₹18L - ₹30L</option>
          </select>
        </label>
      </div>
    </aside>
  )
}
