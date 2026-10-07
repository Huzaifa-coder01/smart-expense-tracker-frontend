import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_BUDGETS, OPENING_BALANCE, generateTransactions } from '../data/mockData'

const ExpenseContext = createContext(null)

const STORAGE_KEY = 'set-data-v1'

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore corrupted storage */
  }
  return null
}

export const ExpenseProvider = ({ children }) => {
  const [state, setState] = useState(() => load() || { transactions: generateTransactions(), budgets: DEFAULT_BUDGETS })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full / unavailable */
    }
  }, [state])

  const addTransaction = useCallback((tx) => {
    const created = { ...tx, id: `t${Date.now()}${Math.floor(Math.random() * 1000)}` }
    setState((s) => ({ ...s, transactions: [created, ...s.transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)) }))
    return created
  }, [])

  const deleteTransaction = useCallback((id) => {
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }))
  }, [])

  const restoreTransaction = useCallback((tx) => {
    setState((s) => ({ ...s, transactions: [tx, ...s.transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)) }))
  }, [])

  const setBudget = useCallback((category, amount) => {
    setState((s) => ({ ...s, budgets: { ...s.budgets, [category]: Math.max(0, Number(amount) || 0) } }))
  }, [])

  const resetDemoData = useCallback(() => {
    setState({ transactions: generateTransactions(), budgets: DEFAULT_BUDGETS })
  }, [])

  const value = useMemo(
    () => ({
      transactions: state.transactions,
      budgets: state.budgets,
      openingBalance: OPENING_BALANCE,
      addTransaction,
      deleteTransaction,
      restoreTransaction,
      setBudget,
      resetDemoData,
    }),
    [state, addTransaction, deleteTransaction, restoreTransaction, setBudget, resetDemoData],
  )

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useExpenses = () => {
  const ctx = useContext(ExpenseContext)
  if (!ctx) throw new Error('useExpenses must be used inside <ExpenseProvider>')
  return ctx
}
