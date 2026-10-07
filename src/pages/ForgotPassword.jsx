import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import AuthShell, { FormMessage } from '../components/AuthShell'
import { authErrorMessage } from '../context/AuthContext'
import { sendOtp } from '../utils/mockAuth'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Enter your email address.')
    setBusy(true)
    try {
      const { demoCode } = await sendOtp({ email, purpose: 'reset' })
      navigate('/verify-otp', { state: { purpose: 'reset', email: email.trim().toLowerCase(), demoCode, sent: true } })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title='Forgot password?' subtitle="Enter your email and we'll send you a 6-digit code to reset it.">
      <form onSubmit={submit} className='mt-6 space-y-4' noValidate>
        <div>
          <label htmlFor='email' className='mb-1.5 block text-sm font-medium'>Email</label>
          <input id='email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} autoComplete='email' placeholder='you@example.com' className='field' autoFocus />
        </div>

        <FormMessage error={error} />

        <Button type='submit' disabled={busy} className='w-full'>{busy ? 'Sending…' : 'Send code'}</Button>
      </form>

      <p className='mt-5 text-center text-sm text-muted'>
        Remembered it? <Link to='/login' className='font-semibold text-indigo-500 hover:underline'>Back to sign in</Link>
      </p>
    </AuthShell>
  )
}

export default ForgotPassword
