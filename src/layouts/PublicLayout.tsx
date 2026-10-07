import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'

type PublicLayoutProps = {
  children?: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="app-shell">
      <Header />
      <main>{children ?? <Outlet />}</main>
      <Footer />
    </div>
  )
}
