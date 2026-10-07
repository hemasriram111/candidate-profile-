import * as Progress from '@radix-ui/react-progress'

type ProfileCompletionProps = {
  value: number
  label?: string
}

export function ProfileCompletion({ value, label = 'Profile completion' }: ProfileCompletionProps) {
  return (
    <div className="border-y border-[var(--color-border)] py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
          <p className="text-xl font-bold text-[var(--color-text)]">{value}%</p>
        </div>
        <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
          {value < 100 ? 'In progress' : 'Complete'}
        </span>
      </div>
      <Progress.Root value={value} className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
        <Progress.Indicator
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),#ffb25f)] transition-all duration-300"
          style={{ width: `${value}%` }}
        />
      </Progress.Root>
    </div>
  )
}
