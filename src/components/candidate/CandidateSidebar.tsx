import { BellDot, BriefcaseBusiness, Building2, FileText, LayoutGrid, LogOut, MessageSquareText, Newspaper, Settings, Sparkles, Star, UserCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../common/AuthContext'

const groups = [
  {
    title: 'Profile',
    items: [
      { label: 'Profile', path: '/candidate/profile', icon: UserCircle2 },
      { label: 'Resume', path: '/candidate/resume', icon: FileText },
    ],
  },
  {
    title: 'Jobs',
    items: [
      { label: 'Search Jobs', path: '/candidate/jobs', icon: BriefcaseBusiness },
      { label: 'Saved Jobs', path: '/candidate/saved-jobs', icon: Star },
    ],
  },
  {
    title: 'Applications',
    items: [
      { label: 'My Applications', path: '/candidate/applications', icon: LayoutGrid },
      { label: 'Interviews', path: '/candidate/interviews', icon: BellDot },
      { label: 'Offers', path: '/candidate/offers', icon: Building2 },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messages', path: '/candidate/messages', icon: MessageSquareText },
      { label: 'Notifications', path: '/candidate/notifications', icon: BellDot },
    ],
  },
  {
    title: 'Career',
    items: [
      { label: 'Job Alerts', path: '/candidate/job-alerts', icon: Newspaper },
      { label: 'AI Assistant', path: '/candidate/ai-assistant', icon: Sparkles },
      { label: 'Profile Views', path: '/candidate/profile-views', icon: LayoutGrid },
    ],
  },
  {
    title: 'Settings',
    items: [{ label: 'Settings', path: '/candidate/settings', icon: Settings }],
  },
] as const

type SidebarItem = {
  label: string
  path: string
  icon: LucideIcon
}

export function CandidateSidebar() {
  const navigate = useNavigate()
  const { logout, isLoading } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      return
    }
  }

  return (
    <aside className="flex w-full max-w-[280px] flex-col border-r border-[var(--color-border)] py-2 pr-4 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-hidden">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain lg:pr-1">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">{group.title}</p>
            <nav className="space-y-1">
              {group.items.map((item: SidebarItem) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        ))}

      </div>
      <div className="mt-auto shrink-0 border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          {isLoading ? 'Signing out...' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}
