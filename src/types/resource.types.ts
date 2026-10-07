export type ResourceType = 'Resume' | 'Interview' | 'Career Growth' | 'Job Search' | 'Skills'

export type ResourceItem = {
  id: string
  title: string
  type: ResourceType
  excerpt: string
  readTime: string
}
