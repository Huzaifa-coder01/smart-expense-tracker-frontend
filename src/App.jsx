import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ExpenseProvider } from './context/ExpenseContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOtp from './pages/VerifyOtp'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import AddExpense from './pages/AddExpense'
import Reports from './pages/Reports'
import Budget from './pages/Budget'

// Keyed by user so each account (and the guest) gets its own isolated data
const Data = ({ children }) => {
  const { user } = useAuth()
  const uid = user?.uid || 'guest'
  return <ExpenseProvider key={uid} userId={uid}>{children}</ExpenseProvider>
}

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Data>
          <Router>
            <Routes>
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<Signup />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route path='/verify-otp' element={<VerifyOtp />} />
              <Route path='/reset-password' element={<ResetPassword />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path='/' element={<Dashboard />} />
                  <Route path='/transactions' element={<Transactions />} />
                  <Route path='/add-expense' element={<AddExpense />} />
                  <Route path='/reports' element={<Reports />} />
                  <Route path='/budget' element={<Budget />} />
                  <Route path='/profile' element={<Profile />} />
                  <Route path='*' element={<Navigate to='/' replace />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </Data>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
