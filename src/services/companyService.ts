import { mockCompanies } from '../data/mock/mockCompanies'
import type { Company } from '../types/company.types'

export const companyService = {
  getAllCompanies: (): Company[] => mockCompanies,
  getCompanyById: (companyId: string): Company | undefined => mockCompanies.find((company) => company.id === companyId),
}
