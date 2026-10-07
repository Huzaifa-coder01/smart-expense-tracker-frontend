import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRightStartOnRectangleIcon, Bars3Icon, BellIcon, MoonIcon, SunIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../context/ThemeContext'
import { useExpenses } from '../context/ExpenseContext'
import { budgetStatus } from '../utils/analytics'
import { formatMoney, monthLabel, currentMonthKey } from '../utils/format'
import { toneOf } from './ui'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Avatar'

const TITLES = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/add-expense': 'Add Expense',
  '/reports': 'Reports',
  '/budget': 'Budget',
  '/profile': 'Profile',
}

const Navbar = ({ onMenu }) => {
  const { pathname } = useLocation()
  const { dark, toggle } = useTheme()
  const { transactions, budgets } = useExpenses()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const alerts = useMemo(
    () => budgetStatus(transactions, budgets).filter((s) => s.state === 'over' || s.state === 'near').sort((a, b) => b.pct - a.pct),
    [transactions, budgets],
  )

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const esc = (e) => e.key === 'Escape' && (setOpen(false), setMenuOpen(false))
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [])

  return (
    <header className='sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl'>
      <div className='mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8'>
        <button onClick={onMenu} className='rounded-xl p-2 text-muted hover:bg-surface-2 lg:hidden' aria-label='Open menu'>
          <Bars3Icon className='h-6 w-6' />
        </button>

        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold sm:text-base'>{TITLES[pathname] || 'Smart Expense Tracker'}</p>
          <p className='hidden text-xs text-muted sm:block'>{monthLabel(currentMonthKey(), 'long')}</p>
        </div>

        <div className='ml-auto flex items-center gap-1.5 sm:gap-2'>
          <Link
            to='/add-expense'
            className='hidden items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 sm:inline-flex'
          >
            <PlusIcon className='h-4 w-4' /> New
          </Link>

          <button onClick={toggle} className='rounded-xl p-2.5 text-muted transition hover:bg-surface-2 hover:text-fg' aria-label='Toggle dark mode'>
            {dark ? <SunIcon className='h-5 w-5' /> : <MoonIcon className='h-5 w-5' />}
          </button>

          <div className='relative' ref={ref}>
            <button onClick={() => setOpen((o) => !o)} className='relative rounded-xl p-2.5 text-muted transition hover:bg-surface-2 hover:text-fg' aria-label='Notifications'>
              <BellIcon className='h-5 w-5' />
              {alerts.length > 0 && <span className='absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-bg' />}
            </button>
            {open && (
              <div className='card absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden'>
                <div className='border-b border-line px-4 py-3'>
                  <p className='text-sm font-semibold'>Budget alerts</p>
                </div>
                {alerts.length === 0 ? (
                  <p className='px-4 py-6 text-center text-sm text-muted'>All budgets look healthy 🎉</p>
                ) : (
                  <ul className='max-h-72 divide-y divide-line overflow-y-auto'>
                    {alerts.map((a) => (
                      <li key={a.id}>
                        <Link to='/budget' onClick={() => setOpen(false)} className='flex items-start gap-3 px-4 py-3 transition hover:bg-surface-2'>
                          <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${toneOf(a.state).cls}`}>{toneOf(a.state).glyph}</span>
                          <span className='text-sm'>
                            <span className='font-semibold'>{a.label}</span>{' '}
                            {a.state === 'over' ? `is ${formatMoney(-a.remaining)} over budget` : `has used ${Math.round(a.pct)}% of its budget`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className='relative ml-1' ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label='Account menu'
              aria-haspopup='menu'
              aria-expanded={menuOpen}
              className='rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60'
            >
              <Avatar user={user} />
            </button>
            {menuOpen && (
              <div role='menu' className='card absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden'>
                <div className='border-b border-line px-4 py-3'>
                  <p className='truncate text-sm font-semibold'>{user.fullName}</p>
                  <p className='truncate text-xs text-muted'>{user.guest ? 'Guest mode' : user.email}</p>
                </div>
                <div className='p-1.5'>
                  <Link
                    to='/profile'
                    role='menuitem'
                    onClick={() => setMenuOpen(false)}
                    className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-surface-2'
                  >
                    <UserCircleIcon className='h-5 w-5 text-muted' /> Profile
                  </Link>
                  <button
                    role='menuitem'
                    onClick={async () => {
                      setMenuOpen(false)
                      await signOut()
                      navigate('/login', { replace: true })
                    }}
                    className='flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-500 transition hover:bg-surface-2'
                  >
                    <ArrowRightStartOnRectangleIcon className='h-5 w-5' /> {user.guest ? 'Exit guest mode' : 'Sign out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
