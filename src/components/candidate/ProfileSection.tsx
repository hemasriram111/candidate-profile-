import type { ReactNode } from 'react'

type ProfileSectionProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function ProfileSection({ title, description, action, children }: ProfileSectionProps) {
  return (
    <section className="border-b border-[var(--color-border)] py-5 first:border-t sm:py-7">
      <div className="mb-5 flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
          {description ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
