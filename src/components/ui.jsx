import React from 'react'
import { motion } from 'framer-motion'
import { getCategory } from '../data/categories'
import { useTheme } from '../context/ThemeContext'

export const CategoryIcon = ({ id, size = 'md' }) => {
  const { dark } = useTheme()
  const cat = getCategory(id)
  const Icon = cat.icon
  const color = dark ? cat.dark : cat.color
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl'
  return (
    <span className={`${box} grid shrink-0 place-items-center`} style={{ background: `${color}1f`, color }}>
      <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </span>
  )
}

export const PageHeader = ({ title, subtitle, children }) => (
  <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
    <div>
      <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{title}</h1>
      {subtitle && <p className='mt-1 text-sm text-muted'>{subtitle}</p>}
    </div>
    {children && <div className='flex flex-wrap items-center gap-2'>{children}</div>}
  </div>
)

export const Button = ({ variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-brand text-white shadow-md shadow-indigo-500/25 hover:brightness-110',
    secondary: 'border border-line bg-surface text-fg hover:bg-surface-2',
    ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

// Status is never colour-alone: every tone carries an icon glyph + label
const TONES = {
  ok: { label: 'On track', glyph: '✓', cls: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  near: { label: 'Near limit', glyph: '!', cls: 'bg-amber-500/14 text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  over: { label: 'Over budget', glyph: '▲', cls: 'bg-rose-500/12 text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' },
  none: { label: 'No limit', glyph: '–', cls: 'bg-surface-2 text-muted', bar: 'bg-slate-400' },
}
export const toneOf = (state) => TONES[state] || TONES.none

export const StatusBadge = ({ state }) => {
  const t = toneOf(state)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${t.cls}`}>
      <span aria-hidden>{t.glyph}</span>
      {t.label}
    </span>
  )
}

export const ProgressBar = ({ pct, state = 'ok', height = 'h-2' }) => (
  <div className={`w-full overflow-hidden rounded-full bg-surface-2 ${height}`} role='progressbar' aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
    <motion.div
      className={`${height} rounded-full ${toneOf(state).bar}`}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(pct, 100)}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  </div>
)

export const Delta = ({ value, inverse = false, suffix = 'vs last month' }) => {
  const up = value >= 0
  const good = inverse ? !up : up
  return (
    <span className='inline-flex items-center gap-1.5 text-xs text-muted'>
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${good ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/12 text-rose-600 dark:text-rose-400'}`}>
        <span aria-hidden>{up ? '▲' : '▼'}</span>
        {Math.abs(value).toFixed(1)}%
      </span>
      {suffix}
    </span>
  )
}

export const StatCard = ({ label, value, icon: Icon, tint, children, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.35 }}
    className='card p-5'
  >
    <div className='flex items-center justify-between'>
      <p className='text-sm font-medium text-muted'>{label}</p>
      <span className='grid h-9 w-9 place-items-center rounded-xl' style={{ background: `${tint}1f`, color: tint }}>
        <Icon className='h-5 w-5' />
      </span>
    </div>
    <p className='tabular mt-3 text-2xl font-bold tracking-tight sm:text-[1.7rem]'>{value}</p>
    <div className='mt-2 min-h-5'>{children}</div>
  </motion.div>
)

export const EmptyState = ({ title, body }) => (
  <div className='grid place-items-center px-6 py-14 text-center'>
    <div className='mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-xl'>🗂️</div>
    <p className='font-semibold'>{title}</p>
    <p className='mt-1 max-w-xs text-sm text-muted'>{body}</p>
  </div>
)

// Shared recharts tooltip, themed with the app tokens
export const ChartTooltip = ({ active, payload, label, labelFormatter, valueFormatter }) => {
  if (!active || !payload?.length) return null
  return (
    <div className='rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card'>
      <p className='mb-1 font-semibold text-fg'>{labelFormatter ? labelFormatter(label, payload) : label}</p>
      {payload
        .filter((p) => p.value !== undefined && p.value !== 0)
        .map((p) => (
          <div key={p.dataKey || p.name} className='flex items-center justify-between gap-6 py-0.5'>
            <span className='flex items-center gap-1.5 text-muted'>
              <span className='h-2 w-2 rounded-full' style={{ background: p.color || p.fill || p.stroke }} />
              {p.name}
            </span>
            <span className='tabular font-semibold text-fg'>{valueFormatter(p.value)}</span>
          </div>
        ))}
    </div>
  )
}

export const useChartColors = () => {
  const { dark } = useTheme()
  return {
    dark,
    grid: dark ? '#252c42' : '#e4e7f0',
    axis: dark ? '#8d97b0' : '#64748b',
    income: dark ? '#3987e5' : '#2a78d6',
    expense: dark ? '#d95926' : '#eb6834',
    surface: dark ? '#121725' : '#ffffff',
  }
}
