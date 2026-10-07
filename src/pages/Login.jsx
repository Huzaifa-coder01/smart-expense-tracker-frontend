import React, { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import AuthShell, { FormMessage } from '../components/AuthShell'
import { authErrorMessage, useAuth } from '../context/AuthContext'
import { DEMO_CREDENTIALS, sendOtp } from '../utils/mockAuth'

const Login = () => {
  const { user, signIn, continueAsGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user?.verified) return <Navigate to={from} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return setError('Enter your email and password.')
    setBusy(true)
    try {
      const u = signIn(email, password)
      if (u.verified) return navigate(from, { replace: true })
      // Signed up earlier but never confirmed the email: send a fresh code and continue verification
      const { demoCode } = await sendOtp({ email: u.email, purpose: 'signup' })
      navigate('/verify-otp', { replace: true, state: { purpose: 'signup', demoCode, sent: true } })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const guest = () => {
    continueAsGuest()
    navigate(from, { replace: true })
  }

  return (
    <AuthShell title='Welcome back' subtitle='Sign in to see your expenses.'>
      {location.state?.notice && (
        <p className='mt-5 rounded-xl bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-300'>{location.state.notice}</p>
      )}

      <form onSubmit={submit} className='mt-6 space-y-4' noValidate>
        <div>
          <label htmlFor='email' className='mb-1.5 block text-sm font-medium'>Email</label>
          <input id='email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} autoComplete='email' placeholder='you@example.com' className='field' />
        </div>
        <div>
          <div className='mb-1.5 flex items-center justify-between'>
            <label htmlFor='password' className='block text-sm font-medium'>Password</label>
            <Link to='/forgot-password' className='text-xs font-medium text-indigo-500 hover:underline'>Forgot password?</Link>
          </div>
          <input id='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} autoComplete='current-password' placeholder='Your password' className='field' />
        </div>

        <FormMessage error={error} />

        <Button type='submit' disabled={busy} className='w-full'>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>

      <div className='mt-4 rounded-xl bg-surface-2 p-3 text-xs text-muted'>
        <p className='font-semibold text-fg'>Demo account</p>
        <p className='mt-0.5'>{DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}</p>
        <button
          type='button'
          onClick={() => {
            setEmail(DEMO_CREDENTIALS.email)
            setPassword(DEMO_CREDENTIALS.password)
            setError('')
          }}
          className='mt-1.5 font-semibold text-indigo-500 hover:underline'
        >
          Fill in demo details
        </button>
      </div>

      <p className='mt-5 text-center text-sm text-muted'>
        Don&apos;t have an account? <Link to='/signup' className='font-semibold text-indigo-500 hover:underline'>Sign up</Link>
      </p>
      <Button variant='ghost' onClick={guest} className='mt-3 w-full'>Continue as guest</Button>
    </AuthShell>
  )
}

export default Login
