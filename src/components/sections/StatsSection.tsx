const stats = [
  { value: '1 profile', label: 'Build once' },
  { value: '4 steps', label: 'From search to offer' },
  { value: 'Daily', label: 'Fresh roles' },
  { value: '24/7', label: 'Application tracking' },
]

export function StatsSection() {
  return (
    <section className="stats-band">
      <div className="container stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-item">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
