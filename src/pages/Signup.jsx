import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import AuthShell, { FormMessage } from '../components/AuthShell'
import { authErrorMessage, useAuth } from '../context/AuthContext'
import { sendOtp } from '../utils/mockAuth'

const Signup = () => {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Only bounce fully signed-in users; a just-created (unverified) account continues to OTP below
  if (user?.verified) return <Navigate to='/' replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      const u = signUp(name, email, password)
      const { demoCode } = await sendOtp({ email: u.email, purpose: 'signup' })
      navigate('/verify-otp', { replace: true, state: { purpose: 'signup', demoCode, sent: true } })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title='Create your account' subtitle='Start tracking your money in minutes.'>
      <form onSubmit={submit} className='mt-6 space-y-4' noValidate>
        <div>
          <label htmlFor='name' className='mb-1.5 block text-sm font-medium'>Full name</label>
          <input id='name' value={name} onChange={(e) => setName(e.target.value)} autoComplete='name' placeholder='Your name' className='field' />
        </div>
        <div>
          <label htmlFor='email' className='mb-1.5 block text-sm font-medium'>Email</label>
          <input id='email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} autoComplete='email' placeholder='you@example.com' className='field' />
        </div>
        <div>
          <label htmlFor='password' className='mb-1.5 block text-sm font-medium'>Password</label>
          <input id='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} autoComplete='new-password' placeholder='At least 6 characters' className='field' />
        </div>
        <div>
          <label htmlFor='confirm' className='mb-1.5 block text-sm font-medium'>Confirm password</label>
          <input id='confirm' type='password' value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete='new-password' placeholder='Repeat your password' className='field' />
        </div>

        <FormMessage error={error} />

        <Button type='submit' disabled={busy} className='w-full'>{busy ? 'Creating account…' : 'Create account'}</Button>
      </form>

      <p className='mt-5 text-center text-sm text-muted'>
        Already have an account? <Link to='/login' className='font-semibold text-indigo-500 hover:underline'>Sign in</Link>
      </p>
    </AuthShell>
  )
}

export default Signup
