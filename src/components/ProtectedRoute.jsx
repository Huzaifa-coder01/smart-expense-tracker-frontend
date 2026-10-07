import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <span className='h-8 w-8 animate-spin rounded-full border-2 border-line border-t-indigo-500' aria-label='Loading' />
      </div>
    )
  }
  if (!user) return <Navigate to='/login' replace state={{ from: location.pathname }} />
  // Accounts must confirm their email with the OTP before using the app
  if (!user.verified) return <Navigate to='/verify-otp' replace state={{ purpose: 'signup' }} />
  return <Outlet />
}

export default ProtectedRoute
