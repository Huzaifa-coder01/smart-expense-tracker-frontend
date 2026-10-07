import React, { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { useExpenses } from '../context/ExpenseContext'
import { EXPENSE_CATEGORIES, categoryColor, getCategory } from '../data/categories'
import { monthlyByCategory, monthlySeries, spendByCategory, spendByWeekday, topMerchants, percentChange, expensesOnly } from '../utils/analytics'
import { currentMonthKey, downloadCSV, formatCompact, formatMoney, monthLabel, shiftMonthKey, daysInMonth } from '../utils/format'
import { Button, CategoryIcon, ChartTooltip, PageHeader, StatCard, useChartColors, Delta } from '../components/ui'
import { BanknotesIcon, CalendarDaysIcon, FireIcon, ScaleIcon } from '@heroicons/react/24/outline'

const RANGES = [
  { n: 3, label: '3M' },
  { n: 6, label: '6M' },
]

const Reports = () => {
  const { transactions } = useExpenses()
  const c = useChartColors()
  const [range, setRange] = useState(6)
  const now = currentMonthKey()

  const series = useMemo(() => monthlySeries(transactions, range), [transactions, range])
  const keys = series.map((s) => s.key)
  const stacked = useMemo(() => monthlyByCategory(transactions, range).map((r) => ({ ...r, name: monthLabel(r.key) })), [transactions, range])
  const weekdays = useMemo(() => spendByWeekday(transactions, range), [transactions, range])
  const merchants = useMemo(() => topMerchants(transactions, keys), [transactions, keys])

  const totalSpent = series.reduce((s, m) => s + m.expense, 0)
  const totalIncome = series.reduce((s, m) => s + m.income, 0)
  const days = series.reduce((s, m) => s + (m.key === now ? Number(new Date().getDate()) : daysInMonth(m.key)), 0)
  // the current month is only partly over, so don't dilute the monthly average with it
  const monthsElapsed = range - 1 + new Date().getDate() / daysInMonth(now)
  const peak = [...series].sort((a, b) => b.expense - a.expense)[0]
  const prevSeries = useMemo(() => monthlySeries(transactions, range, shiftMonthKey(now, -range)), [transactions, range, now])
  const prevSpent = prevSeries.reduce((s, m) => s + m.expense, 0)

  // Category table: total across range + change vs the last full month
  const categoryRows = useMemo(() => {
    const totals = {}
    keys.forEach((k) => spendByCategory(transactions, k).forEach((x) => (totals[x.id] = (totals[x.id] || 0) + x.value)))
    const grand = Object.values(totals).reduce((a, b) => a + b, 0)
    return EXPENSE_CATEGORIES.map((cat) => ({ ...cat, total: totals[cat.id] || 0, share: grand ? ((totals[cat.id] || 0) / grand) * 100 : 0 }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [transactions, keys])

  const exportReport = () =>
    downloadCSV(
      expensesOnly(transactions)
        .filter((t) => keys.includes(t.date.slice(0, 7)))
        .map((t) => ({ Date: t.date, Title: t.title, Category: getCategory(t.category).label, Amount: t.amount, Method: t.method })),
      `expense-report-${range}m.csv`,
    )

  const axis = { tick: { fill: c.axis, fontSize: 12 }, tickLine: false, axisLine: false }
  const maxDay = Math.max(...weekdays.map((d) => d.value))

  return (
    <>
      <PageHeader title='Reports' subtitle='Understand your spending patterns over time.'>
        <div className='flex rounded-xl bg-surface-2 p-1' role='tablist'>
          {RANGES.map((r) => (
            <button
              key={r.n}
              role='tab'
              aria-selected={range === r.n}
              onClick={() => setRange(r.n)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${range === r.n ? 'bg-surface shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button variant='secondary' onClick={exportReport}>
          <ArrowDownTrayIcon className='h-4 w-4' /> Export
        </Button>
      </PageHeader>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard index={0} label={`Spent (${range}M)`} value={formatMoney(totalSpent)} icon={BanknotesIcon} tint='#f43f5e'>
          {prevSpent > 0 ? (
            <Delta value={percentChange(totalSpent, prevSpent)} inverse suffix={`vs prior ${range}M`} />
          ) : (
            <span className='text-xs text-muted'>Includes this month so far</span>
          )}
        </StatCard>
        <StatCard index={1} label='Avg monthly spend' value={formatMoney(totalSpent / monthsElapsed)} icon={CalendarDaysIcon} tint='#6366f1'>
          <span className='text-xs text-muted'>Income avg {formatMoney(totalIncome / monthsElapsed)}</span>
        </StatCard>
        <StatCard index={2} label='Avg daily spend' value={formatMoney(totalSpent / days)} icon={ScaleIcon} tint='#10b981'>
          <span className='text-xs text-muted'>Over {days} days</span>
        </StatCard>
        <StatCard index={3} label='Highest month' value={monthLabel(peak.key, 'long')} icon={FireIcon} tint='#f59e0b'>
          <span className='text-xs text-muted'>{formatMoney(peak.expense)} spent</span>
        </StatCard>
      </div>

      <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <section className='card p-5 lg:col-span-2'>
          <h2 className='font-semibold'>Monthly spending by category</h2>
          <p className='mb-4 text-xs text-muted'>Stacked by category · hover a segment for details</p>
          <div className='h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={stacked} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} strokeDasharray='3 4' vertical={false} />
                <XAxis dataKey='name' {...axis} />
                <YAxis {...axis} tickFormatter={formatCompact} width={52} />
                <Tooltip cursor={{ fill: c.grid, fillOpacity: 0.35 }} content={<ChartTooltip valueFormatter={formatMoney} />} />
                <Legend iconType='circle' iconSize={8} wrapperStyle={{ paddingTop: 12 }} formatter={(v) => <span className='text-xs text-muted'>{v}</span>} />
                {EXPENSE_CATEGORIES.map((cat, i) => (
                  <Bar
                    key={cat.id}
                    dataKey={cat.id}
                    name={cat.label}
                    stackId='spend'
                    fill={categoryColor(cat.id, c.dark)}
                    stroke={c.surface}
                    strokeWidth={2}
                    radius={i === EXPENSE_CATEGORIES.length - 1 ? [4, 4, 0, 0] : 0}
                    maxBarSize={56}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className='card p-5'>
          <h2 className='font-semibold'>Spending by weekday</h2>
          <p className='mb-4 text-xs text-muted'>Total across the last {range} months</p>
          <div className='h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={weekdays} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} strokeDasharray='3 4' vertical={false} />
                <XAxis dataKey='day' {...axis} />
                <YAxis {...axis} tickFormatter={formatCompact} width={52} />
                <Tooltip cursor={{ fill: c.grid, fillOpacity: 0.35 }} content={<ChartTooltip valueFormatter={formatMoney} />} />
                <Bar dataKey='value' name='Spent' fill={c.income} radius={[4, 4, 0, 0]} maxBarSize={32} fillOpacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className='mt-2 text-xs text-muted'>
            Busiest day: <span className='font-semibold text-fg'>{weekdays.find((d) => d.value === maxDay)?.day}</span>
          </p>
        </section>
      </div>

      <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <section className='card p-5'>
          <h2 className='mb-4 font-semibold'>Category breakdown</h2>
          <ul className='space-y-3.5'>
            {categoryRows.map((r) => (
              <li key={r.id}>
                <div className='mb-1.5 flex items-center justify-between text-sm'>
                  <span className='flex items-center gap-2 font-medium'>
                    <span className='h-2.5 w-2.5 rounded-full' style={{ background: categoryColor(r.id, c.dark) }} />
                    {r.label}
                  </span>
                  <span className='tabular text-muted'>
                    <span className='font-semibold text-fg'>{formatMoney(r.total)}</span> · {r.share.toFixed(0)}%
                  </span>
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-surface-2'>
                  <div className='h-2 rounded-full' style={{ width: `${r.share}%`, background: categoryColor(r.id, c.dark) }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className='card p-5'>
          <h2 className='mb-2 font-semibold'>Top spending items</h2>
          <p className='mb-3 text-xs text-muted'>Merchants and bills with the highest total</p>
          <ul className='divide-y divide-line'>
            {merchants.map((m, i) => (
              <li key={m.title} className='flex items-center gap-3 py-3'>
                <span className='w-5 text-center text-sm font-semibold text-muted'>{i + 1}</span>
                <CategoryIcon id={m.category} size='sm' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold'>{m.title}</p>
                  <p className='text-xs text-muted'>
                    {m.count} transaction{m.count > 1 ? 's' : ''}
                  </p>
                </div>
                <p className='tabular text-sm font-bold'>{formatMoney(m.total)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

export default Reports
