import React, { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useExpenses } from '../context/ExpenseContext'
import { monthlySeries } from '../utils/analytics'
import { formatCompact, formatMoney, monthLabel } from '../utils/format'
import { ChartTooltip, useChartColors } from './ui'

// Income vs expenses over the last 6 months (one y-axis, two series, 2px lines)
const CashFlowChart = () => {
  const { transactions } = useExpenses()
  const c = useChartColors()
  const data = useMemo(() => monthlySeries(transactions, 6).map((m) => ({ ...m, name: monthLabel(m.key) })), [transactions])

  return (
    <div className='card flex h-full flex-col p-5'>
      <div className='mb-4'>
        <h2 className='font-semibold'>Cash flow</h2>
        <p className='text-xs text-muted'>Income vs expenses · last 6 months</p>
      </div>
      <div className='min-h-64 w-full flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id='gIncome' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor={c.income} stopOpacity={0.28} />
                <stop offset='100%' stopColor={c.income} stopOpacity={0} />
              </linearGradient>
              <linearGradient id='gExpense' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor={c.expense} stopOpacity={0.28} />
                <stop offset='100%' stopColor={c.expense} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={c.grid} strokeDasharray='3 4' vertical={false} />
            <XAxis dataKey='name' tick={{ fill: c.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: c.axis, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={52} />
            <Tooltip
              content={<ChartTooltip valueFormatter={formatMoney} />}
              cursor={{ stroke: c.axis, strokeDasharray: '3 3', strokeOpacity: 0.5 }}
            />
            <Legend verticalAlign='top' align='right' height={28} iconType='circle' iconSize={8} formatter={(v) => <span className='text-xs text-muted'>{v}</span>} />
            <Area type='monotone' name='Income' dataKey='income' stroke={c.income} strokeWidth={2} fill='url(#gIncome)' dot={false} activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }} />
            <Area type='monotone' name='Expenses' dataKey='expense' stroke={c.expense} strokeWidth={2} fill='url(#gExpense)' dot={false} activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default CashFlowChart
