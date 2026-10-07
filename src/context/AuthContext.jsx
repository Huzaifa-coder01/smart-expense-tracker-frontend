import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import * as mock from '../utils/mockAuth'

const AuthContext = createContext(null)

const GUEST_KEY = 'set-guest-v1'

const readGuest = () => {
  try {
    return localStorage.getItem(GUEST_KEY) === '1'
  } catch {
    return false
  }
}

const setGuestFlag = (on) => {
  try {
    if (on) localStorage.setItem(GUEST_KEY, '1')
    else localStorage.removeItem(GUEST_KEY)
  } catch {
    /* storage unavailable - guest lasts for this tab only */
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const authErrorMessage = (err) => err?.message || 'Something went wrong. Please try again.'

const toProfile = (u) => ({
  uid: u.uid,
  name: u.name.split(' ')[0],
  fullName: u.name,
  email: u.email,
  photoURL: null,
  guest: false,
  verified: u.verified,
})

const GUEST_PROFILE = { uid: 'guest', name: 'Guest', fullName: 'Guest (demo)', email: '', photoURL: null, guest: true, verified: true }

export const AuthProvider = ({ children }) => {
  const [version, setVersion] = useState(0) // bumped whenever the mock store changes
  const [guest, setGuest] = useState(readGuest)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const user = useMemo(() => {
    const u = mock.getSessionUser()
    return u ? toProfile(u) : guest ? GUEST_PROFILE : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guest, version])

  const signIn = useCallback(
    (email, password) => {
      const u = mock.signIn(email, password)
      setGuestFlag(false)
      setGuest(false)
      bump()
      return toProfile(u)
    },
    [bump],
  )

  const signUp = useCallback(
    (name, email, password) => {
      const u = mock.signUp(name, email, password)
      setGuestFlag(false)
      setGuest(false)
      bump()
      return toProfile(u)
    },
    [bump],
  )

  // Call after mock.verifyOtp('signup') succeeds so the session user picks up verified=true
  const refreshUser = bump

  const updateName = useCallback(
    (name) => {
      mock.updateName(user.uid, name)
      bump()
    },
    [user, bump],
  )

  const continueAsGuest = useCallback(() => {
    setGuestFlag(true)
    setGuest(true)
  }, [])

  const signOut = useCallback(() => {
    mock.signOut()
    setGuestFlag(false)
    setGuest(false)
    bump()
  }, [bump])

  const value = useMemo(
    () => ({ user, loading: false, signIn, signUp, refreshUser, updateName, continueAsGuest, signOut }),
    [user, signIn, signUp, refreshUser, updateName, continueAsGuest, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
