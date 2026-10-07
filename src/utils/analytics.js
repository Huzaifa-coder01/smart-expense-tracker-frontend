import { EXPENSE_CATEGORIES, getCategory } from '../data/categories'
import { monthKey, shiftMonthKey, currentMonthKey, daysInMonth, todayISO, parseISO } from './format'

const sum = (list) => list.reduce((s, t) => s + t.amount, 0)

export const inMonth = (txs, key) => txs.filter((t) => monthKey(t.date) === key)
export const expensesOnly = (txs) => txs.filter((t) => t.type === 'expense')
export const incomeOnly = (txs) => txs.filter((t) => t.type === 'income')

// `uptoDay` limits the month to its first N days (for fair month-to-date comparisons)
export const monthTotals = (txs, key, uptoDay = 31) => {
  const list = inMonth(txs, key).filter((t) => Number(t.date.slice(8, 10)) <= uptoDay)
  const income = sum(incomeOnly(list))
  const expense = sum(expensesOnly(list))
  return { income, expense, savings: income - expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0 }
}

export const percentChange = (now, prev) => (prev === 0 ? (now === 0 ? 0 : 100) : ((now - prev) / prev) * 100)

// Spend per expense category for a month -> [{ id, label, value }] (sorted desc, zero-valued removed)
export const spendByCategory = (txs, key, uptoDay = 31) => {
  const totals = {}
  expensesOnly(inMonth(txs, key)).filter((t) => Number(t.date.slice(8, 10)) <= uptoDay).forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount
  })
  return EXPENSE_CATEGORIES.map((c) => ({ id: c.id, label: c.label, value: totals[c.id] || 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
}

// Last `n` months ending at the current month -> [{ key, label, income, expense }]
export const monthlySeries = (txs, n = 6, end = currentMonthKey()) =>
  Array.from({ length: n }, (_, i) => {
    const key = shiftMonthKey(end, i - (n - 1))
    const { income, expense } = monthTotals(txs, key)
    return { key, income, expense, savings: income - expense }
  })

// Stacked-bar friendly: one row per month with a column per expense category
export const monthlyByCategory = (txs, n = 6) =>
  monthlySeries(txs, n).map(({ key }) => {
    const row = { key }
    spendByCategory(txs, key).forEach((c) => (row[c.id] = c.value))
    return row
  })

export const totalBalance = (txs, opening) => opening + sum(incomeOnly(txs)) - sum(expensesOnly(txs))

// How far through the current month we are
export const monthProgress = () => {
  const key = currentMonthKey()
  const day = Number(todayISO().slice(8, 10))
  return { key, day, total: daysInMonth(key) }
}

// Month-end forecast. Early in the month a straight-line run rate is misleading (rent and bills land
// first), so blend it with the average of the previous three full months, weighted by month progress.
export const projectedMonthSpend = (txs) => {
  const { key, day, total } = monthProgress()
  const spent = monthTotals(txs, key).expense
  const runRate = day > 0 ? (spent / day) * total : spent
  const history = [1, 2, 3].map((i) => monthTotals(txs, shiftMonthKey(key, -i)).expense).filter((v) => v > 0)
  const avg = history.length ? history.reduce((a, b) => a + b, 0) / history.length : runRate
  const w = day / total
  return { spent, projected: Math.max(spent, w * runRate + (1 - w) * avg), day, total }
}

export const budgetStatus = (txs, budgets, key = currentMonthKey()) => {
  const spent = Object.fromEntries(spendByCategory(txs, key).map((c) => [c.id, c.value]))
  return EXPENSE_CATEGORIES.map((c) => {
    const limit = budgets[c.id] || 0
    const used = spent[c.id] || 0
    const pct = limit > 0 ? (used / limit) * 100 : 0
    const state = limit === 0 ? 'none' : pct >= 100 ? 'over' : pct >= 80 ? 'near' : 'ok'
    return { id: c.id, label: c.label, limit, used, pct, remaining: limit - used, state }
  })
}

export const spendByWeekday = (txs, n = 3) => {
  const start = shiftMonthKey(currentMonthKey(), -(n - 1))
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const totals = days.map((d) => ({ day: d, value: 0, count: 0 }))
  expensesOnly(txs)
    .filter((t) => monthKey(t.date) >= start)
    .forEach((t) => {
      const i = parseISO(t.date).getDay()
      totals[i].value += t.amount
      totals[i].count += 1
    })
  return totals
}

export const topMerchants = (txs, keys, limit = 6) => {
  const map = {}
  expensesOnly(txs)
    .filter((t) => keys.includes(monthKey(t.date)))
    .forEach((t) => {
      const m = (map[t.title] ||= { title: t.title, category: t.category, total: 0, count: 0 })
      m.total += t.amount
      m.count += 1
    })
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, limit)
}

// Plain-language insights shown on the dashboard
export const buildInsights = (txs, budgets) => {
  const key = currentMonthKey()
  const prev = shiftMonthKey(key, -1)
  const insights = []

  const cur = spendByCategory(txs, key)
  const prevMap = Object.fromEntries(spendByCategory(txs, prev).map((c) => [c.id, c.value]))
  const { projected } = projectedMonthSpend(txs)
  const status = budgetStatus(txs, budgets, key)

  const over = status.filter((s) => s.state === 'over')
  if (over.length) {
    const worst = over.sort((a, b) => b.used - b.limit - (a.used - a.limit))[0]
    insights.push({ tone: 'critical', title: `${worst.label} is over budget`, body: `You've exceeded your ${worst.label.toLowerCase()} limit by`, amount: worst.used - worst.limit })
  }

  const jumps = cur
    .filter((c) => prevMap[c.id] > 0 && c.value > prevMap[c.id] * 1.2 && c.value - prevMap[c.id] > 2000)
    .sort((a, b) => b.value / prevMap[b.id] - a.value / prevMap[a.id])
  if (jumps.length) {
    const j = jumps[0]
    const pct = Math.round(percentChange(j.value, prevMap[j.id]))
    insights.push({ tone: 'warning', title: `${j.label} spending is up ${pct}%`, body: `Compared to last month you're spending more on ${j.label.toLowerCase()}.` })
  }

  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0)
  if (totalBudget > 0) {
    const diff = totalBudget - projected
    insights.push(
      diff >= 0
        ? { tone: 'good', title: 'On track this month', body: 'At your current pace you will finish under budget by', amount: diff }
        : { tone: 'warning', title: 'Pace is above budget', body: 'At your current pace you will overshoot your total budget by', amount: -diff },
    )
  }

  const { savingsRate } = monthTotals(txs, prev)
  if (savingsRate >= 20) {
    insights.push({ tone: 'good', title: `You saved ${Math.round(savingsRate)}% last month`, body: 'Great discipline - above the recommended 20% savings rate.' })
  }

  return insights.slice(0, 3)
}

export const categoryLabel = (id) => getCategory(id).label
