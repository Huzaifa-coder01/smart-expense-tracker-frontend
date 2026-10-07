import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ExpenseProvider } from './context/ExpenseContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import AddExpense from './pages/AddExpense'
import Reports from './pages/Reports'
import Budget from './pages/Budget'

const App = () => {
  return (
    <ThemeProvider>
      <ExpenseProvider>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path='/' element={<Dashboard />} />
              <Route path='/transactions' element={<Transactions />} />
              <Route path='/add-expense' element={<AddExpense />} />
              <Route path='/reports' element={<Reports />} />
              <Route path='/budget' element={<Budget />} />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Route>
          </Routes>
        </Router>
      </ExpenseProvider>
    </ThemeProvider>
  )
}

export default App
