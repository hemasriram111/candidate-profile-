import { ArrowRight, BarChart3, Brain, BriefcaseBusiness, Cloud, Code2, Coins, Megaphone, Palette, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Category } from '../../types/category.types'

const categoryIcons: Record<string, LucideIcon> = {
  'software-development': Code2,
  'ai-ml': Brain,
  'data-science': BarChart3,
  'cloud-devops': Cloud,
  'product-design': Palette,
  marketing: Megaphone,
  finance: Coins,
  'human-resources': UsersRound,
}

type CategoryCardProps = {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = categoryIcons[category.id] ?? BriefcaseBusiness

  return (
    <Link to={`/jobs?category=${encodeURIComponent(category.name)}`} className="category-card">
      <div className="category-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.8} /></div>
      <div className="category-copy">
        <h3>{category.name}</h3>
        <p>{category.jobs.toLocaleString()} jobs</p>
      </div>
      <ArrowRight size={18} className="category-arrow" />
    </Link>
  )
}
