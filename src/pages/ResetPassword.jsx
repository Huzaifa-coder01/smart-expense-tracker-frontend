import React, { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import AuthShell, { FormMessage } from '../components/AuthShell'
import { authErrorMessage } from '../context/AuthContext'
import { resetPassword } from '../utils/mockAuth'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Only reachable straight after a successful reset-OTP verification
  if (!state?.email || !state?.resetToken) return <Navigate to='/forgot-password' replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      await resetPassword({ email: state.email, resetToken: state.resetToken, password })
      navigate('/login', { replace: true, state: { notice: 'Password updated. Sign in with your new password.' } })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title='Set a new password' subtitle={`Choose a new password for ${state.email}.`}>
      <form onSubmit={submit} className='mt-6 space-y-4' noValidate>
        <div>
          <label htmlFor='password' className='mb-1.5 block text-sm font-medium'>New password</label>
          <input id='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} autoComplete='new-password' placeholder='At least 6 characters' className='field' autoFocus />
        </div>
        <div>
          <label htmlFor='confirm' className='mb-1.5 block text-sm font-medium'>Confirm password</label>
          <input id='confirm' type='password' value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete='new-password' placeholder='Repeat your password' className='field' />
        </div>

        <FormMessage error={error} />

        <Button type='submit' disabled={busy} className='w-full'>{busy ? 'Saving…' : 'Update password'}</Button>
      </form>
    </AuthShell>
  )
}

export default ResetPassword
