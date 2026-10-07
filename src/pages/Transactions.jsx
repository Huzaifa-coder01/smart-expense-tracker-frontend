import React, { useMemo, useState } from 'react'
import { ArrowDownTrayIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'
import { CATEGORIES, getCategory } from '../data/categories'
import { downloadCSV, formatDate, formatMoney, monthKey, monthLabel } from '../utils/format'
import { Button, CategoryIcon, EmptyState, PageHeader } from '../components/ui'

const PAGE = 15

const Transactions = () => {
  const { transactions, deleteTransaction, restoreTransaction } = useExpenses()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [month, setMonth] = useState('all')
  const [sort, setSort] = useState('date-desc')
  const [visible, setVisible] = useState(PAGE)

  const months = useMemo(() => [...new Set(transactions.map((t) => monthKey(t.date)))].sort().reverse(), [transactions])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = transactions.filter(
      (t) =>
        (type === 'all' || t.type === type) &&
        (category === 'all' || t.category === category) &&
        (month === 'all' || monthKey(t.date) === month) &&
        (!term || t.title.toLowerCase().includes(term) || getCategory(t.category).label.toLowerCase().includes(term) || t.method?.toLowerCase().includes(term)),
    )
    const sorters = {
      'date-desc': (a, b) => (a.date < b.date ? 1 : -1),
      'date-asc': (a, b) => (a.date > b.date ? 1 : -1),
      'amount-desc': (a, b) => b.amount - a.amount,
      'amount-asc': (a, b) => a.amount - b.amount,
    }
    return [...list].sort(sorters[sort])
  }, [transactions, q, type, category, month, sort])

  const totals = useMemo(
    () => ({
      income: filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }),
    [filtered],
  )

  const reset = (setter) => (e) => {
    setter(e.target.value)
    setVisible(PAGE)
  }

  const remove = (t) => {
    deleteTransaction(t.id)
    toast.info(
      <span>
        Deleted “{t.title}”{' '}
        <button className='ml-1 font-semibold text-indigo-500 underline' onClick={() => restoreTransaction(t)}>
          Undo
        </button>
      </span>,
    )
  }

  const exportCSV = () =>
    downloadCSV(
      filtered.map((t) => ({ Date: t.date, Title: t.title, Type: t.type, Category: getCategory(t.category).label, Amount: t.amount, Method: t.method, Note: t.note })),
      'transactions.csv',
    )

  return (
    <>
      <PageHeader title='Transactions' subtitle={`${filtered.length} of ${transactions.length} transactions`}>
        <Button variant='secondary' onClick={exportCSV} disabled={!filtered.length}>
          <ArrowDownTrayIcon className='h-4 w-4' /> Export CSV
        </Button>
        <Link to='/add-expense'>
          <Button>+ Add new</Button>
        </Link>
      </PageHeader>

      <div className='card mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6'>
        <div className='relative sm:col-span-2'>
          <MagnifyingGlassIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted' />
          <input value={q} onChange={reset(setQ)} placeholder='Search title, category, method…' className='field pl-9!' aria-label='Search transactions' />
        </div>
        <select value={type} onChange={reset(setType)} className='field' aria-label='Type'>
          <option value='all'>All types</option>
          <option value='expense'>Expenses</option>
          <option value='income'>Income</option>
        </select>
        <select value={category} onChange={reset(setCategory)} className='field' aria-label='Category'>
          <option value='all'>All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select value={month} onChange={reset(setMonth)} className='field' aria-label='Month'>
          <option value='all'>All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m, 'long')}
            </option>
          ))}
        </select>
        <select value={sort} onChange={reset(setSort)} className='field' aria-label='Sort'>
          <option value='date-desc'>Newest first</option>
          <option value='date-asc'>Oldest first</option>
          <option value='amount-desc'>Highest amount</option>
          <option value='amount-asc'>Lowest amount</option>
        </select>
      </div>

      <div className='mb-4 grid grid-cols-2 gap-3'>
        <div className='card px-4 py-3'>
          <p className='text-xs text-muted'>Income (filtered)</p>
          <p className='tabular text-lg font-bold text-emerald-600 dark:text-emerald-400'>+{formatMoney(totals.income)}</p>
        </div>
        <div className='card px-4 py-3'>
          <p className='text-xs text-muted'>Expenses (filtered)</p>
          <p className='tabular text-lg font-bold'>−{formatMoney(totals.expense)}</p>
        </div>
      </div>

      <div className='card overflow-hidden'>
        {!filtered.length ? (
          <EmptyState title='No transactions found' body='Try a different search term or clear some filters.' />
        ) : (
          <>
            <div className='hidden grid-cols-[1fr_9rem_8rem_8rem_2.5rem] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:grid'>
              <span>Transaction</span>
              <span>Category</span>
              <span>Date</span>
              <span className='text-right'>Amount</span>
              <span />
            </div>
            <ul className='divide-y divide-line'>
              {filtered.slice(0, visible).map((t) => (
                <li key={t.id} className='group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 transition hover:bg-surface-2 md:grid-cols-[1fr_9rem_8rem_8rem_2.5rem]'>
                  <div className='flex min-w-0 items-center gap-3'>
                    <CategoryIcon id={t.category} />
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-semibold'>{t.title}</p>
                      <p className='truncate text-xs text-muted'>
                        {t.method}
                        {t.note ? ` · ${t.note}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className='hidden text-sm md:block'>{getCategory(t.category).label}</span>
                  <span className='hidden text-sm text-muted md:block'>{formatDate(t.date)}</span>
                  <div className='text-right'>
                    <p className={`tabular text-sm font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      {t.type === 'income' ? '+' : '−'}
                      {formatMoney(t.amount)}
                    </p>
                    <p className='text-xs text-muted md:hidden'>
                      {formatDate(t.date)} ·{' '}
                      <button onClick={() => remove(t)} className='font-medium text-rose-500' aria-label={`Delete ${t.title}`}>
                        Delete
                      </button>
                    </p>
                  </div>
                  <button
                    onClick={() => remove(t)}
                    aria-label={`Delete ${t.title}`}
                    className='hidden justify-self-end rounded-lg p-1.5 text-muted transition hover:bg-rose-500/10 hover:text-rose-500 md:block md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100'
                  >
                    <TrashIcon className='h-4 w-4' />
                  </button>
                </li>
              ))}
            </ul>
            {visible < filtered.length && (
              <div className='border-t border-line p-3 text-center'>
                <Button variant='ghost' onClick={() => setVisible((v) => v + PAGE)}>
                  Show more ({filtered.length - visible} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default Transactions
