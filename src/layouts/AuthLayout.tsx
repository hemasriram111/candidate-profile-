import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

type AuthLayoutProps = {
  children?: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return <div className="auth-shell">{children ?? <Outlet />}</div>
}
