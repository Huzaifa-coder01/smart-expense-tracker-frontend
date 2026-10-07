import React, { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import AuthShell, { DemoCode, FormMessage } from '../components/AuthShell'
import OtpInput from '../components/OtpInput'
import { authErrorMessage, useAuth } from '../context/AuthContext'
import { sendOtp, verifyOtp } from '../utils/mockAuth'

const RESEND_SECONDS = 30
const OTP_LENGTH = 6

const VerifyOtp = () => {
  const { user, refreshUser, signOut } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const purpose = state?.purpose === 'reset' ? 'reset' : 'signup'
  const email = purpose === 'reset' ? state?.email : user?.email

  const [otp, setOtp] = useState('')
  const [boxKey, setBoxKey] = useState(0) // remounting clears the boxes
  const [demoCode, setDemoCode] = useState(state?.demoCode || '')
  const [cooldown, setCooldown] = useState(state?.sent ? RESEND_SECONDS : 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  if (purpose === 'reset' && !email) return <Navigate to='/forgot-password' replace />
  if (purpose === 'signup' && !user) return <Navigate to='/login' replace />
  if (purpose === 'signup' && (user.guest || user.verified)) return <Navigate to='/' replace />

  const resend = async () => {
    setError('')
    setInfo('')
    try {
      const res = await sendOtp({ email, purpose })
      setDemoCode(res.demoCode)
      setCooldown(RESEND_SECONDS)
      setOtp('')
      setBoxKey((k) => k + 1)
      setInfo('A new code has been sent.')
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (otp.length !== OTP_LENGTH) return setError(`Enter the ${OTP_LENGTH}-digit code.`)
    setBusy(true)
    try {
      const res = await verifyOtp({ email, otp, purpose })
      if (purpose === 'reset') {
        navigate('/reset-password', { replace: true, state: { email, resetToken: res.resetToken } })
      } else {
        refreshUser()
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(authErrorMessage(err))
      setOtp('')
      setBoxKey((k) => k + 1)
    } finally {
      setBusy(false)
    }
  }

  const useOtherAccount = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AuthShell title='Verify your email' subtitle={`Enter the 6-digit code for ${email}.`}>
      <DemoCode code={demoCode} />

      <form onSubmit={submit} className='mt-6 space-y-4' noValidate>
        <OtpInput key={boxKey} length={OTP_LENGTH} onChange={setOtp} disabled={busy} />

        <FormMessage error={error} info={info} />

        <Button type='submit' disabled={busy || otp.length !== OTP_LENGTH} className='w-full'>{busy ? 'Verifying…' : 'Verify'}</Button>
      </form>

      <p className='mt-5 text-center text-sm text-muted'>
        Didn&apos;t get a code?{' '}
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button type='button' onClick={resend} className='font-semibold text-indigo-500 hover:underline'>
            {demoCode ? 'Resend code' : 'Send code'}
          </button>
        )}
      </p>
      <p className='mt-2 text-center text-sm text-muted'>
        {purpose === 'signup' ? (
          <button type='button' onClick={useOtherAccount} className='font-semibold text-indigo-500 hover:underline'>Use a different account</button>
        ) : (
          <Link to='/forgot-password' className='font-semibold text-indigo-500 hover:underline'>Use a different email</Link>
        )}
      </p>
    </AuthShell>
  )
}

export default VerifyOtp
