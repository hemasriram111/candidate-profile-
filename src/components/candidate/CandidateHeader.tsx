import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bell, Bookmark, BriefcaseBusiness, ChevronDown, FileText, LogOut, Menu, Search, UserRound, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { useAuth } from '../common/AuthContext'

type CandidateHeaderProps = {
  onToggleMobileNav: () => void
  mobileNavOpen: boolean
}

const primaryLinks = [
  { label: 'Explore jobs', to: '/candidate/jobs', icon: BriefcaseBusiness },
  { label: 'Saved jobs', to: '/candidate/saved-jobs', icon: Bookmark },
  { label: 'Applications', to: '/candidate/applications', icon: FileText },
  { label: 'Offers', to: '/candidate/offers', icon: FileText },
]

export function CandidateHeader({ onToggleMobileNav, mobileNavOpen }: CandidateHeaderProps) {
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [accountError, setAccountError] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const handleQuickSearchShortcut = (event: KeyboardEvent) => {
      const target = event.target
      const isTyping = target instanceof HTMLElement && (
        target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )
      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        setSearchOpen(true)
      } else if (event.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', handleQuickSearchShortcut)
    return () => document.removeEventListener('keydown', handleQuickSearchShortcut)
  }, [])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedQuery = query.trim()
    navigate(trimmedQuery ? `/candidate/jobs?query=${encodeURIComponent(trimmedQuery)}` : '/candidate/jobs')
    setSearchOpen(false)
  }

  const signOut = async () => {
    setAccountError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setAccountError('Could not sign out. Please try again.')
    }
  }

  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'C'

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={onToggleMobileNav}
          aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <Link to="/candidate/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label="Clyptus home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--color-primary),#ffb25f)] text-sm font-bold text-white">C</span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">Clyptus</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {primaryLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-orange-50 text-orange-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/candidate/interviews"
            className={({ isActive }) => `rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-orange-50 text-orange-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
          >
            Interviews
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 justify-start gap-2 border-slate-200 px-3 text-slate-600 sm:min-w-48 lg:min-w-64"
            onClick={() => setSearchOpen((open) => !open)}
            aria-expanded={searchOpen}
            aria-controls="candidate-quick-search"
          >
            <Search className="h-4 w-4" />
            <span className="hidden truncate sm:inline">Search jobs, skills, companies</span>
            <span className="sm:hidden">Search</span>
            <kbd className="ml-auto hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 lg:inline">/</kbd>
          </Button>
          <Link
            to="/candidate/notifications"
            aria-label="Notifications"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:flex"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 p-1.5 pr-2.5 text-left hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{initials}</span>
              <span className="hidden max-w-32 truncate text-sm font-medium text-slate-800 sm:inline">{user?.name || 'My account'}</span>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Candidate'}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <Link to="/candidate/profile" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <UserRound className="h-4 w-4" /> Profile
              </Link>
              <Link to="/candidate/resume" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <FileText className="h-4 w-4" /> Resume
              </Link>
              <button type="button" disabled={isLoading} onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                <LogOut className="h-4 w-4" /> {isLoading ? 'Signing out…' : 'Sign out'}
              </button>
              {accountError ? <p role="alert" className="px-3 py-2 text-xs text-red-700">{accountError}</p> : null}
            </div>
          </details>
        </div>
      </div>

      {mobileNavOpen ? (
        <nav aria-label="Mobile navigation" className="border-t border-slate-200 bg-white px-4 py-2 lg:hidden">
          <div className="mx-auto flex max-w-[1280px] flex-col sm:flex-row sm:flex-wrap">
            {[...primaryLinks, { label: 'Interviews', to: '/candidate/interviews', icon: Bell }, { label: 'Notifications', to: '/candidate/notifications', icon: Bell }].map((item) => {
              const Icon = item.icon
              return <NavLink key={item.to} to={item.to} onClick={onToggleMobileNav} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-orange-50 text-orange-800' : 'text-slate-700 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{item.label}</NavLink>
            })}
          </div>
        </nav>
      ) : null}

      {searchOpen ? (
        <div id="candidate-quick-search" className="absolute inset-x-0 top-full border-b border-slate-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-xl">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-3xl gap-2">
            <label className="sr-only" htmlFor="candidate-quick-search-input">Search jobs, skills, or companies</label>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                id="candidate-quick-search-input"
                ref={searchInput}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false) }}
                placeholder="Role, skill, or company"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <Button type="submit">Search</Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Close search" onClick={() => setSearchOpen(false)}><X className="h-4 w-4" /></Button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-xs text-slate-500">Press Enter to search current openings.</p>
        </div>
      ) : null}
    </header>
  )
}
