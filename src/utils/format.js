export const CURRENCY = 'Rs.'

const nf = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 })

export const formatMoney = (n) => `${CURRENCY} ${nf.format(Math.round(n || 0))}`

// 125000 -> "125K", 1.4M -> "1.4M" (for chart axes and tight spaces)
export const formatCompact = (n) => {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`
  return String(Math.round(n))
}

export const formatPercent = (n, digits = 0) => `${n.toFixed(digits)}%`

// ---- dates (all dates are 'YYYY-MM-DD' strings, parsed as local time) ----
const pad = (n) => String(n).padStart(2, '0')

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const monthKey = (s) => s.slice(0, 7)
export const todayISO = () => toISO(new Date())
export const currentMonthKey = () => todayISO().slice(0, 7)

export const shiftMonthKey = (key, delta) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const monthLabel = (key, style = 'short') => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: style,
    ...(style === 'long' ? { year: 'numeric' } : {}),
  })
}

export const daysInMonth = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export const formatDate = (s) =>
  parseISO(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

export const relativeDay = (s) => {
  const diff = Math.round((parseISO(todayISO()) - parseISO(s)) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff > 1 && diff < 7) return parseISO(s).toLocaleDateString('en-US', { weekday: 'long' })
  return parseISO(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export const downloadCSV = (rows, filename) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = Object.keys(rows[0] || {})
  const csv = [header.join(','), ...rows.map((r) => header.map((h) => esc(r[h])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
