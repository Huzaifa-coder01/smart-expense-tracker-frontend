import React, { useMemo, useState } from 'react'
import { CheckIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { useExpenses } from '../context/ExpenseContext'
import { budgetStatus, monthProgress } from '../utils/analytics'
import { formatMoney } from '../utils/format'
import { CategoryIcon, PageHeader, ProgressBar, StatusBadge, toneOf } from '../components/ui'

const BudgetCard = ({ item, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  const start = () => {
    setValue(String(item.limit || ''))
    setEditing(true)
  }
  const save = () => {
    onSave(item.id, value)
    setEditing(false)
    toast.success(`${item.label} budget updated`)
  }

  return (
    <div className='card p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <CategoryIcon id={item.id} />
          <div>
            <p className='font-semibold'>{item.label}</p>
            <StatusBadge state={item.state} />
          </div>
        </div>
        {!editing && (
          <button onClick={start} className='rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-fg' aria-label={`Edit ${item.label} budget`}>
            <PencilSquareIcon className='h-4 w-4' />
          </button>
        )}
      </div>

      <div className='mt-4 flex items-end justify-between'>
        <p className='tabular text-2xl font-bold'>{formatMoney(item.used)}</p>
        {editing ? null : <p className='tabular text-sm text-muted'>of {formatMoney(item.limit)}</p>}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
          className='mt-2 flex items-center gap-2'
        >
          <input autoFocus type='number' min='0' value={value} onChange={(e) => setValue(e.target.value)} className='field' aria-label='Monthly limit' />
          <button type='submit' className='rounded-xl bg-emerald-500 p-2.5 text-white hover:bg-emerald-600' aria-label='Save'>
            <CheckIcon className='h-4 w-4' />
          </button>
          <button type='button' onClick={() => setEditing(false)} className='rounded-xl border border-line p-2.5 text-muted hover:bg-surface-2' aria-label='Cancel'>
            <XMarkIcon className='h-4 w-4' />
          </button>
        </form>
      ) : (
        <div className='mt-3'>
          <ProgressBar pct={item.pct} state={item.state} height='h-2.5' />
          <div className='mt-2 flex justify-between text-xs text-muted'>
            <span>{Math.round(item.pct)}% used</span>
            <span className={item.remaining < 0 ? 'font-semibold text-rose-500' : ''}>
              {item.remaining >= 0 ? `${formatMoney(item.remaining)} left` : `${formatMoney(-item.remaining)} over`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

const Budget = () => {
  const { transactions, budgets, setBudget } = useExpenses()
  const items = useMemo(() => budgetStatus(transactions, budgets), [transactions, budgets])
  const { day, total: daysTotal } = monthProgress()

  const totalLimit = items.reduce((s, i) => s + i.limit, 0)
  const totalUsed = items.reduce((s, i) => s + i.used, 0)
  const pct = totalLimit ? (totalUsed / totalLimit) * 100 : 0
  const state = pct >= 100 ? 'over' : pct >= 80 ? 'near' : 'ok'
  const monthPct = (day / daysTotal) * 100
  const flagged = items.filter((i) => i.state === 'over' || i.state === 'near').length

  return (
    <>
      <PageHeader title='Budget' subtitle='Set monthly limits per category and stay ahead of overspending.' />

      <section className='card mb-6 overflow-hidden p-5 sm:p-6'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <p className='text-sm text-muted'>Total monthly budget</p>
            <p className='tabular mt-1 text-3xl font-bold tracking-tight'>
              {formatMoney(totalUsed)} <span className='text-lg font-medium text-muted'>/ {formatMoney(totalLimit)}</span>
            </p>
          </div>
          <div className='flex gap-6 text-sm'>
            <div>
              <p className='text-muted'>Remaining</p>
              <p className={`tabular font-bold ${totalLimit - totalUsed < 0 ? 'text-rose-500' : ''}`}>{formatMoney(totalLimit - totalUsed)}</p>
            </div>
            <div>
              <p className='text-muted'>Need attention</p>
              <p className='font-bold'>
                {flagged} categor{flagged === 1 ? 'y' : 'ies'}
              </p>
            </div>
            <div>
              <p className='text-muted'>Status</p>
              <StatusBadge state={state} />
            </div>
          </div>
        </div>

        <div className='relative mt-6'>
          <ProgressBar pct={pct} state={state} height='h-3' />
          {/* marker for how far through the month we are */}
          <div className='absolute -top-1.5 h-6 w-0.5 rounded bg-fg/60' style={{ left: `${monthPct}%` }} title={`Day ${day} of ${daysTotal}`} />
        </div>
        <div className='mt-2 flex justify-between text-xs text-muted'>
          <span className={toneOf(state).cls.split(' ').filter((c) => c.startsWith('text-')).join(' ')}>{Math.round(pct)}% of budget used</span>
          <span>▏ Day {day} of {daysTotal} ({Math.round(monthPct)}% of month)</span>
        </div>
      </section>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {items.map((item) => (
          <BudgetCard key={item.id} item={item} onSave={setBudget} />
        ))}
      </div>
    </>
  )
}

export default Budget
