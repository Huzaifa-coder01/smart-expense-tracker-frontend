import React, { useMemo, useState } from 'react'
import { Pie, PieChart, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { useExpenses } from '../context/ExpenseContext'
import { categoryColor } from '../data/categories'
import { spendByCategory } from '../utils/analytics'
import { currentMonthKey, formatMoney, monthLabel } from '../utils/format'
import { ChartTooltip, EmptyState, useChartColors } from './ui'

// Donut of this month's spending by category, with a legend that carries the values
const ChartComponent = () => {
  const { transactions } = useExpenses()
  const { dark, surface } = useChartColors()
  const [active, setActive] = useState(null)
  const key = currentMonthKey()

  const data = useMemo(() => spendByCategory(transactions, key), [transactions, key])
  const total = data.reduce((s, d) => s + d.value, 0)
  const focus = active !== null ? data[active] : null

  return (
    <div className='card flex h-full flex-col p-5'>
      <div className='mb-1 flex items-center justify-between'>
        <h2 className='font-semibold'>Spending by category</h2>
        <span className='text-xs text-muted'>{monthLabel(key, 'long')}</span>
      </div>

      {!data.length ? (
        <EmptyState title='No expenses yet' body='Add your first expense to see the breakdown.' />
      ) : (
        <>
          <div className='relative mx-auto h-52 w-full max-w-[260px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={data}
                  dataKey='value'
                  nameKey='label'
                  innerRadius='66%'
                  outerRadius='96%'
                  paddingAngle={2}
                  stroke={surface}
                  strokeWidth={2}
                  cornerRadius={4}
                  onMouseEnter={(_, i) => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                >
                  {data.map((d, i) => (
                    <Cell key={d.id} fill={categoryColor(d.id, dark)} opacity={active === null || active === i ? 1 : 0.35} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip valueFormatter={formatMoney} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className='pointer-events-none absolute inset-0 grid place-items-center text-center'>
              <div>
                <p className='text-xs text-muted'>{focus ? focus.label : 'Total spent'}</p>
                <p className='tabular text-lg font-bold'>{formatMoney(focus ? focus.value : total)}</p>
                {focus && <p className='text-xs text-muted'>{Math.round((focus.value / total) * 100)}%</p>}
              </div>
            </div>
          </div>

          <ul className='mt-4 space-y-1.5'>
            {data.slice(0, 6).map((d, i) => (
              <li
                key={d.id}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className='flex items-center justify-between rounded-lg px-2 py-1 text-sm transition hover:bg-surface-2'
              >
                <span className='flex items-center gap-2'>
                  <span className='h-2.5 w-2.5 rounded-full' style={{ background: categoryColor(d.id, dark) }} />
                  {d.label}
                </span>
                <span className='tabular text-muted'>
                  <span className='font-medium text-fg'>{formatMoney(d.value)}</span> · {Math.round((d.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default ChartComponent
