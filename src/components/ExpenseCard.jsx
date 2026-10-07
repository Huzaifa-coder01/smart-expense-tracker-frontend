import React from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { CategoryIcon } from './ui'
import { getCategory } from '../data/categories'
import { formatMoney, relativeDay } from '../utils/format'

// A single transaction row. Pass `onDelete` to show the delete action.
const ExpenseCard = ({ title, amount, category, date, type = 'expense', method, onDelete }) => {
  const income = type === 'income'
  return (
    <div className='group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface-2'>
      <CategoryIcon id={category} />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold'>{title}</p>
        <p className='truncate text-xs text-muted'>
          {getCategory(category).label}
          {method ? ` · ${method}` : ''} · {relativeDay(date)}
        </p>
      </div>
      <p className={`tabular text-sm font-bold ${income ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
        {income ? '+' : '−'}
        {formatMoney(amount)}
      </p>
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`Delete ${title}`}
          className='rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 focus:opacity-100 group-hover:opacity-100'
        >
          <TrashIcon className='h-4 w-4' />
        </button>
      )}
    </div>
  )
}

export default ExpenseCard
