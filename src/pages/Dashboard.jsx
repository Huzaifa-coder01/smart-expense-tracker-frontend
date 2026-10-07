import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeftIcon, ArrowUpRightIcon, BanknotesIcon, ChartPieIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { useExpenses } from '../context/ExpenseContext'
import { buildInsights, budgetStatus, monthProgress, monthTotals, percentChange, totalBalance } from '../utils/analytics'
import { currentMonthKey, formatMoney, greeting, shiftMonthKey } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import { Delta, PageHeader, ProgressBar, StatCard } from '../components/ui'
import ExpenseCard from '../components/ExpenseCard'
import ChartComponent from '../components/ChartComponent'
import CashFlowChart from '../components/CashFlowChart'

const Dashboard = () => {
  const { user } = useAuth()
  const { transactions, budgets, openingBalance } = useExpenses()
  const key = currentMonthKey()

  const { cur, prev, balance, status, insights } = useMemo(
    () => ({
      cur: monthTotals(transactions, key),
      prev: monthTotals(transactions, shiftMonthKey(key, -1), monthProgress().day), // same days last month
      balance: totalBalance(transactions, openingBalance),
      status: budgetStatus(transactions, budgets, key).filter((s) => s.limit > 0).sort((a, b) => b.pct - a.pct),
      insights: buildInsights(transactions, budgets),
    }),
    [transactions, budgets, openingBalance, key],
  )

  const INSIGHT_STYLE = {
    good: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
    critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  }
  const INSIGHT_GLYPH = { good: '✓', warning: '!', critical: '▲' }

  return (
    <>
      <PageHeader title={`${greeting()}, ${user.name} 👋`} subtitle="Here's what's happening with your money this month." />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard index={0} label='Total balance' value={formatMoney(balance)} icon={BanknotesIcon} tint='#6366f1'>
          <span className='text-xs text-muted'>Across all accounts</span>
        </StatCard>
        <StatCard index={1} label='Income' value={formatMoney(cur.income)} icon={ArrowDownLeftIcon} tint='#10b981'>
          <Delta value={percentChange(cur.income, prev.income)} suffix='vs same days last month' />
        </StatCard>
        <StatCard index={2} label='Expenses' value={formatMoney(cur.expense)} icon={ArrowUpRightIcon} tint='#f43f5e'>
          <Delta value={percentChange(cur.expense, prev.expense)} inverse suffix='vs same days last month' />
        </StatCard>
        <StatCard index={3} label='Savings rate' value={`${cur.savingsRate.toFixed(0)}%`} icon={ChartPieIcon} tint='#f59e0b'>
          <span className='text-xs text-muted'>
            {formatMoney(cur.savings)} saved · target 20%
          </span>
        </StatCard>
      </div>

      <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <CashFlowChart />
        </div>
        <ChartComponent />
      </div>

      <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <section className='card p-5 lg:col-span-2'>
          <div className='mb-2 flex items-center justify-between'>
            <h2 className='font-semibold'>Recent transactions</h2>
            <Link to='/transactions' className='text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300'>
              View all
            </Link>
          </div>
          <div className='-mx-2'>
            {transactions.slice(0, 7).map((t) => (
              <ExpenseCard key={t.id} {...t} />
            ))}
          </div>
        </section>

        <div className='space-y-4'>
          <section className='card p-5'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-semibold'>Budget status</h2>
              <Link to='/budget' className='text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300'>
                Manage
              </Link>
            </div>
            <ul className='space-y-4'>
              {status.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <div className='mb-1.5 flex items-center justify-between text-sm'>
                    <span className='font-medium'>{s.label}</span>
                    <span className='tabular text-xs text-muted'>
                      {formatMoney(s.used)} / {formatMoney(s.limit)}
                    </span>
                  </div>
                  <ProgressBar pct={s.pct} state={s.state} />
                </li>
              ))}
            </ul>
          </section>

          <section className='card p-5'>
            <h2 className='mb-3 flex items-center gap-2 font-semibold'>
              <LightBulbIcon className='h-5 w-5 text-amber-500' /> Smart insights
            </h2>
            <ul className='space-y-3'>
              {insights.map((i) => (
                <li key={i.title} className='flex gap-3'>
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${INSIGHT_STYLE[i.tone]}`}>{INSIGHT_GLYPH[i.tone]}</span>
                  <p className='text-sm'>
                    <span className='font-semibold'>{i.title}</span>
                    <span className='block text-muted'>
                      {i.body}
                      {i.amount !== undefined && <span className='font-semibold text-fg'> {formatMoney(i.amount)}</span>}
                    </span>
                  </p>
                </li>
              ))}
              {!insights.length && <li className='text-sm text-muted'>Add a few more transactions to unlock insights.</li>}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}

export default Dashboard

