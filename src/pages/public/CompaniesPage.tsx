import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CompanyGrid } from '../../components/companies/CompanyGrid'
import { mockCompanies } from '../../data/mock/mockCompanies'

export function CompaniesPage() {
  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')

  const filteredCompanies = useMemo(() => {
    return mockCompanies.filter((company) => {
      const matchesQuery =
        !query ||
        company.name.toLowerCase().includes(query.toLowerCase()) ||
        company.industry.toLowerCase().includes(query.toLowerCase())
      const matchesIndustry = !industry || company.industry === industry
      const matchesLocation = !location || company.location.toLowerCase().includes(location.toLowerCase())
      return matchesQuery && matchesIndustry && matchesLocation
    })
  }, [query, industry, location])

  return (
    <section className="page-shell">
      <div className="container">
        <div className="page-header compact">
          <div>
            <span className="eyebrow">Companies</span>
            <h1>Search companies</h1>
          </div>
        </div>

        <div className="company-toolbar">
          <label className="search-input compact wide">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies" aria-label="Search companies" />
          </label>
          <select value={industry} onChange={(event) => setIndustry(event.target.value)} aria-label="Industry filter">
            <option value="">All industries</option>
            <option value="Technology">Technology</option>
            <option value="SaaS">SaaS</option>
            <option value="Analytics">Analytics</option>
            <option value="Product">Product</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Recruitment">Recruitment</option>
          </select>
          <select value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Location filter">
            <option value="">All locations</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Pune">Pune</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Remote">Remote</option>
          </select>
        </div>

        <div className="results-header inline-header">
          <h2>{filteredCompanies.length} companies</h2>
        </div>

        <CompanyGrid companies={filteredCompanies} />
      </div>
    </section>
  )
}
