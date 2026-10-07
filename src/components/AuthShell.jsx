import React from 'react'
import { motion } from 'framer-motion'
import { Logo } from './Sidebar'

export const FormMessage = ({ error, info }) => (
  <>
    {error && <p role='alert' className='text-sm font-medium text-rose-500'>{error}</p>}
    {info && <p className='text-sm font-medium text-emerald-600 dark:text-emerald-400'>{info}</p>}
  </>
)

// Mock mode has no email service, so the OTP is surfaced here instead of being sent.
export const DemoCode = ({ code }) =>
  code ? (
    <div className='mt-5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-center text-xs text-indigo-700 dark:text-indigo-300'>
      Demo mode - no email is sent. Your code is <span className='text-base font-bold tracking-[0.3em]'>{code}</span>
    </div>
  ) : null

const AuthShell = ({ title, subtitle, children }) => (
  <div className='grid min-h-screen place-items-center px-4 py-10'>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className='card w-full max-w-md p-6 sm:p-8'>
      <Logo />
      <h1 className='mt-6 text-2xl font-bold tracking-tight'>{title}</h1>
      {subtitle && <p className='mt-1 text-sm text-muted'>{subtitle}</p>}
      {children}
    </motion.div>
  </div>
)

export default AuthShell
