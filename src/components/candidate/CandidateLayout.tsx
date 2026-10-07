import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CandidateHeader } from './CandidateHeader'

export function CandidateLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <CandidateHeader onToggleMobileNav={() => setMobileNavOpen((open) => !open)} mobileNavOpen={mobileNavOpen} />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
