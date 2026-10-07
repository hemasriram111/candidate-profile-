import type { Company } from '../../types/company.types'
import { CompanyCard } from './CompanyCard'

type CompanyGridProps = {
  companies: Company[]
}

export function CompanyGrid({ companies }: CompanyGridProps) {
  return (
    <div className="company-grid">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  )
}
