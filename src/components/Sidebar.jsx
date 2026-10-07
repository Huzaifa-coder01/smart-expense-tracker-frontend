import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Squares2X2Icon,
  ArrowsRightLeftIcon,
  PlusCircleIcon,
  ChartBarIcon,
  WalletIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Avatar'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: Squares2X2Icon, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowsRightLeftIcon },
  { to: '/add-expense', label: 'Add Expense', icon: PlusCircleIcon },
  { to: '/reports', label: 'Reports', icon: ChartBarIcon },
  { to: '/budget', label: 'Budget', icon: WalletIcon },
]

export const Logo = () => (
  <div className='flex items-center gap-3'>
    <span className='grid h-10 w-10 place-items-center rounded-xl bg-brand shadow-lg shadow-indigo-500/30'>
      <svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='#fff' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M3 17l6-7 4 4 8-10' />
      </svg>
    </span>
    <div className='leading-tight'>
      <p className='text-[15px] font-bold tracking-tight'>Smart Expense</p>
      <p className='text-xs font-medium text-muted'>Tracker</p>
    </div>
  </div>
)

const Sidebar = ({ open, onClose, onOpenChat }) => {
  const { user } = useAuth()
  return (
  <>
    {/* mobile backdrop */}
    {open && <div className='fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden' onClick={onClose} />}

    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface p-4 transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className='mb-8 flex items-center justify-between px-2 pt-2'>
        <Logo />
        <button onClick={onClose} className='rounded-lg p-1.5 text-muted hover:bg-surface-2 lg:hidden' aria-label='Close menu'>
          <XMarkIcon className='h-5 w-5' />
        </button>
      </div>

      <p className='mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted'>Menu</p>
      <nav className='space-y-1'>
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-muted hover:bg-surface-2 hover:text-fg'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId='nav-pill' className='absolute inset-0 rounded-xl bg-indigo-500/10' transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <Icon className='relative h-5 w-5' />
                <span className='relative'>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className='mt-auto space-y-4'>
        <button
          onClick={() => {
            onClose()
            onOpenChat()
          }}
          className='group relative w-full overflow-hidden rounded-2xl bg-brand p-4 text-left text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110'
        >
          <div className='absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10' />
          <SparklesIcon className='mb-2 h-6 w-6' />
          <p className='text-sm font-semibold'>Ask Fina</p>
          <p className='mt-0.5 text-xs text-white/80'>Your AI money assistant. Get answers and insights instantly.</p>
        </button>

        <Link to='/profile' onClick={onClose} className='flex items-center gap-3 rounded-xl border border-line p-3 transition hover:bg-surface-2'>
          <Avatar user={user} />
          <div className='min-w-0 leading-tight'>
            <p className='truncate text-sm font-semibold'>{user.fullName}</p>
            <p className='truncate text-xs text-muted'>{user.guest ? 'Guest mode' : user.email}</p>
          </div>
        </Link>
      </div>
    </aside>
  </>
  )
}

export default Sidebar
