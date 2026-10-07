// Mock auth "backend" backed by localStorage - for demos only (passwords are stored in plain text).
// Replace the exports below with real API calls later; the rest of the app only talks to this module.

const USERS_KEY = 'set-mock-users-v1'
const SESSION_KEY = 'set-mock-session-v1'
const OTP_KEY = 'set-mock-otp-v1'
const RESET_KEY = 'set-mock-reset-v1'
const OTP_TTL_MS = 10 * 60 * 1000

export const DEMO_CREDENTIALS = { email: 'demo@example.com', password: 'demo1234' }

const DEMO_USER = { uid: 'u-demo', name: 'Huzaifa Nadeem', ...DEMO_CREDENTIALS, verified: true }

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const write = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

const norm = (email) => String(email || '').trim().toLowerCase()
const fail = (message) => {
  throw new Error(message)
}

const allUsers = () => {
  const list = read(USERS_KEY, [])
  return list.some((u) => u.uid === DEMO_USER.uid) ? list : [DEMO_USER, ...list]
}
const saveUsers = (list) => write(USERS_KEY, list)
const findByEmail = (email) => allUsers().find((u) => u.email === norm(email))
const publicUser = ({ password: _password, ...u }) => u

export const getSessionUser = () => {
  const uid = read(SESSION_KEY, null)
  const user = uid && allUsers().find((u) => u.uid === uid)
  return user ? publicUser(user) : null
}

export const signIn = (email, password) => {
  const user = findByEmail(email)
  if (!user || user.password !== password) fail('Incorrect email or password.')
  write(SESSION_KEY, user.uid)
  return publicUser(user)
}

export const signUp = (name, email, password) => {
  if (!name.trim()) fail('Enter your name.')
  if (!/^\S+@\S+\.\S+$/.test(norm(email))) fail('Enter a valid email address.')
  if (password.length < 6) fail('Password must be at least 6 characters.')
  if (findByEmail(email)) fail('An account with this email already exists.')
  const user = { uid: `u${Date.now()}`, name: name.trim(), email: norm(email), password, verified: false }
  saveUsers([...allUsers(), user])
  write(SESSION_KEY, user.uid)
  return publicUser(user)
}

export const signOut = () => write(SESSION_KEY, null)

export const updateName = (uid, name) => {
  saveUsers(allUsers().map((u) => (u.uid === uid ? { ...u, name } : u)))
}

// purpose: 'signup' | 'reset'. There is no email service, so the code is returned as `demoCode` and shown on screen.
export const sendOtp = async ({ email, purpose }) => {
  const user = findByEmail(email)
  if (!user) fail('No account found with that email.')
  if (purpose === 'signup' && user.verified) fail('This account is already verified.')
  const code = String(Math.floor(100000 + Math.random() * 900000))
  write(OTP_KEY, { email: user.email, purpose, code, expires: Date.now() + OTP_TTL_MS })
  console.info(`[mock OTP] ${purpose} code for ${user.email}: ${code}`)
  return { demoCode: code }
}

// 'signup' marks the account verified. 'reset' returns a one-time resetToken for resetPassword().
export const verifyOtp = async ({ email, otp, purpose }) => {
  const rec = read(OTP_KEY, null)
  if (!rec || rec.email !== norm(email) || rec.purpose !== purpose) fail('No code was requested. Send a new one.')
  if (Date.now() > rec.expires) fail('This code has expired. Request a new one.')
  if (rec.code !== String(otp)) fail('Incorrect code. Please try again.')
  write(OTP_KEY, null)
  if (purpose === 'signup') {
    saveUsers(allUsers().map((u) => (u.email === rec.email ? { ...u, verified: true } : u)))
    return {}
  }
  const resetToken = `rt${Math.random().toString(36).slice(2)}${Date.now()}`
  write(RESET_KEY, { email: rec.email, resetToken, expires: Date.now() + OTP_TTL_MS })
  return { resetToken }
}

export const resetPassword = async ({ email, resetToken, password }) => {
  const rec = read(RESET_KEY, null)
  if (!rec || rec.email !== norm(email) || rec.resetToken !== resetToken || Date.now() > rec.expires) {
    fail('Your reset session expired. Start again.')
  }
  if (password.length < 6) fail('Password must be at least 6 characters.')
  saveUsers(allUsers().map((u) => (u.email === rec.email ? { ...u, password } : u)))
  write(RESET_KEY, null)
}
