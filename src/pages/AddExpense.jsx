import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useExpenses } from '../context/ExpenseContext'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, getCategory } from '../data/categories'
import { budgetStatus } from '../utils/analytics'
import { formatMoney, todayISO } from '../utils/format'
import { Button, CategoryIcon, PageHeader, ProgressBar } from '../components/ui'
import ExpenseCard from '../components/ExpenseCard'
import { useTheme } from '../context/ThemeContext'

const QUICK = [500, 1000, 2500, 5000]

const AddExpense = () => {
  const { addTransaction, transactions, budgets } = useExpenses()
  const { dark } = useTheme()
  const navigate = useNavigate()

  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('groceries')
  const [date, setDate] = useState(todayISO())
  const [method, setMethod] = useState('Card')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const switchType = (next) => {
    setType(next)
    setCategory(next === 'expense' ? 'groceries' : 'salary')
    setErrors({})
  }

  // Live budget impact for the selected expense category
  const impact = useMemo(() => {
    if (type !== 'expense' || !Number(amount)) return null
    const s = budgetStatus(transactions, budgets).find((x) => x.id === category)
    if (!s || !s.limit) return null
    const after = s.used + Number(amount)
    const pct = (after / s.limit) * 100
    return { ...s, after, pctAfter: pct, state: pct >= 100 ? 'over' : pct >= 80 ? 'near' : 'ok' }
  }, [type, amount, category, transactions, budgets])

  const validate = () => {
    const e = {}
    if (!title.trim()) e.title = 'Give this transaction a name'
    if (!amount || Number(amount) <= 0) e.amount = 'Enter an amount greater than 0'
    if (!date) e.date = 'Pick a date'
    else if (date > todayISO()) e.date = 'Date cannot be in the future'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    addTransaction({ title: title.trim(), amount: Number(amount), category, type, date, method, note: note.trim() })
    toast.success(`${type === 'expense' ? 'Expense' : 'Income'} of ${formatMoney(Number(amount))} added`)
    if (impact?.state === 'over') toast.warn(`${impact.label} is now over budget`)
    setTitle('')
    setAmount('')
    setNote('')
    setErrors({})
  }

  const Err = ({ k }) => (errors[k] ? <p className='mt-1 text-xs font-medium text-rose-500'>{errors[k]}</p> : null)
  const fieldCls = (k) => `field ${errors[k] ? 'border-rose-500! ring-2 ring-rose-500/15' : ''}`

  return (
    <>
      <PageHeader title='Add transaction' subtitle='Log an expense or income in a few seconds.' />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-5'>
        <form onSubmit={handleSubmit} noValidate className='card space-y-6 p-5 sm:p-6 lg:col-span-3'>
          <div className='grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1' role='tablist'>
            {['expense', 'income'].map((t) => (
              <button
                type='button'
                key={t}
                role='tab'
                aria-selected={type === t}
                onClick={() => switchType(t)}
                className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${type === t ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor='amount' className='mb-1.5 block text-sm font-medium'>Amount</label>
            <div className='relative'>
              <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted'>Rs.</span>
              <input
                id='amount'
                type='number'
                inputMode='decimal'
                min='0'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='0'
                className={`${fieldCls('amount')} py-3.5! pl-14! text-2xl! font-bold`}
              />
            </div>
            <Err k='amount' />
            <div className='mt-2 flex flex-wrap gap-2'>
              {QUICK.map((q) => (
                <button type='button' key={q} onClick={() => setAmount(String(q))} className='rounded-full border border-line px-3 py-1 text-xs font-medium text-muted transition hover:border-indigo-500/50 hover:text-fg'>
                  {formatMoney(q)}
                </button>
              ))}
            </div>
            {impact && (
              <div className='mt-3 rounded-xl bg-surface-2 p-3'>
                <div className='mb-2 flex justify-between text-xs'>
                  <span className='font-medium'>{impact.label} budget after this</span>
                  <span className={`tabular font-semibold ${impact.state === 'over' ? 'text-rose-500' : impact.state === 'near' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {Math.round(impact.pctAfter)}% {impact.state === 'over' ? '· over budget' : impact.state === 'near' ? '· near limit' : ''}
                  </span>
                </div>
                <ProgressBar pct={impact.pctAfter} state={impact.state} />
              </div>
            )}
          </div>

          <div>
            <label htmlFor='title' className='mb-1.5 block text-sm font-medium'>Title</label>
            <input id='title' value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === 'expense' ? 'e.g. Weekly groceries' : 'e.g. Freelance payment'} className={fieldCls('title')} />
            <Err k='title' />
          </div>

          <div>
            <p className='mb-2 text-sm font-medium'>Category</p>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
              {categories.map((c) => (
                <button
                  type='button'
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  aria-pressed={category === c.id}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition ${category === c.id ? 'border-indigo-500 bg-indigo-500/8 ring-2 ring-indigo-500/20' : 'border-line hover:bg-surface-2'}`}
                >
                  <CategoryIcon id={c.id} size='sm' />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <label htmlFor='date' className='mb-1.5 block text-sm font-medium'>Date</label>
              <input id='date' type='date' max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls('date')} style={{ colorScheme: dark ? 'dark' : 'light' }} />
              <Err k='date' />
            </div>
            <div>
              <label htmlFor='method' className='mb-1.5 block text-sm font-medium'>Payment method</label>
              <select id='method' value={method} onChange={(e) => setMethod(e.target.value)} className='field'>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor='note' className='mb-1.5 block text-sm font-medium'>Note <span className='font-normal text-muted'>(optional)</span></label>
            <textarea id='note' rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder='Anything worth remembering…' className='field resize-none' />
          </div>

          <div className='flex gap-3'>
            <Button type='submit' className='flex-1 py-3!'>
              Add {type}
            </Button>
            <Button type='button' variant='secondary' onClick={() => navigate('/transactions')}>
              View all
            </Button>
          </div>
        </form>

        <aside className='space-y-4 lg:col-span-2'>
          <div className='card p-5'>
            <p className='mb-3 text-xs font-semibold uppercase tracking-wider text-muted'>Live preview</p>
            <ExpenseCard title={title.trim() || 'Untitled'} amount={Number(amount) || 0} category={category} date={date || todayISO()} type={type} method={method} />
            <p className='mt-3 text-xs text-muted'>
              Will be saved under <span className='font-semibold text-fg'>{getCategory(category).label}</span>.
            </p>
          </div>
          <div className='card p-5'>
            <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-muted'>Recently added</p>
            <div className='-mx-2'>
              {transactions.slice(0, 4).map((t) => (
                <ExpenseCard key={t.id} {...t} />
              ))}
            </div>
          </div>
          <div className='rounded-2xl bg-brand p-5 text-white'>
            <p className='font-semibold'>💡 Pro tip</p>
            <p className='mt-1 text-sm text-white/85'>Open Fina (bottom-right) and type “Add 800 for lunch” — it logs expenses from plain text.</p>
          </div>
        </aside>
      </div>
    </>
  )
}

export default AddExpense
