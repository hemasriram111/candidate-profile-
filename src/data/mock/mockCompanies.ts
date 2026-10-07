import type { Company } from '../../types/company.types'

export const mockCompanies: Company[] = [
  {
    id: 'clyptus-tech',
    name: 'Clyptus Technologies',
    industry: 'Technology',
    location: 'Hyderabad',
    logo: 'CT',
    openPositions: 24,
    description:
      'Clyptus builds intelligence-driven hiring infrastructure for the next generation of career platforms.',
    founded: '2018',
    size: '201-500 employees',
    specialities: ['AI Hiring', 'Talent Discovery', 'Product Experience'],
  },
  {
    id: 'cloudnest',
    name: 'CloudNest',
    industry: 'SaaS',
    location: 'Bengaluru',
    logo: 'CN',
    openPositions: 18,
    description:
      'CloudNest helps enterprises modernise platform operations with intelligent workflow systems and product analytics.',
    founded: '2016',
    size: '501-1000 employees',
    specialities: ['Cloud', 'Platform Engineering', 'Automation'],
  },
  {
    id: 'northstar',
    name: 'NorthStar Labs',
    industry: 'Analytics',
    location: 'Pune',
    logo: 'NS',
    openPositions: 14,
    description:
      'NorthStar Labs analyses growth patterns and digital decision loops across product, service and distribution teams.',
    founded: '2014',
    size: '101-250 employees',
    specialities: ['Data', 'Insights', 'Experimentation'],
  },
  {
    id: 'orbitworks',
    name: 'OrbitWorks',
    industry: 'Product',
    location: 'Mumbai',
    logo: 'OW',
    openPositions: 9,
    description:
      'OrbitWorks designs digital experiences that unify operational intelligence with better customer journeys.',
    founded: '2019',
    size: '51-200 employees',
    specialities: ['Design Systems', 'UX Strategy', 'Growth'],
  },
  {
    id: 'infrahorizon',
    name: 'InfraHorizon',
    industry: 'Infrastructure',
    location: 'Remote',
    logo: 'IH',
    openPositions: 21,
    description:
      'InfraHorizon supports modern teams with resilient cloud architecture and secure platform automation.',
    founded: '2017',
    size: '201-500 employees',
    specialities: ['AWS', 'Kubernetes', 'Security'],
  },
  {
    id: 'talentbridge',
    name: 'TalentBridge',
    industry: 'Recruitment',
    location: 'Delhi',
    logo: 'TB',
    openPositions: 12,
    description:
      'TalentBridge connects emerging talent with high-growth companies through an insight-led hiring process.',
    founded: '2020',
    size: '51-200 employees',
    specialities: ['Talent Strategy', 'Hiring Ops', 'Candidate Experience'],
  },
]
