import { CATEGORIES, EXPENSE_CATEGORIES, getCategory } from '../data/categories'
import { formatMoney, currentMonthKey, shiftMonthKey, monthLabel, relativeDay, todayISO, toISO } from './format'
import { budgetStatus, expensesOnly, inMonth, monthTotals, percentChange, projectedMonthSpend, spendByCategory, totalBalance } from './analytics'

// Keywords used to map free text ("lunch at kfc") onto a category
const KEYWORDS = {
  groceries: ['grocery', 'groceries', 'supermarket', 'vegetable', 'fruit', 'milk', 'imtiaz', 'carrefour'],
  dining: ['lunch', 'dinner', 'breakfast', 'restaurant', 'coffee', 'cafe', 'pizza', 'burger', 'food', 'foodpanda', 'biryani', 'eat', 'snack'],
  transport: ['uber', 'careem', 'fuel', 'petrol', 'diesel', 'taxi', 'ride', 'bus', 'rickshaw', 'bykea', 'indrive', 'parking'],
  shopping: ['clothes', 'shirt', 'shoes', 'daraz', 'shopping', 'dress', 'mall', 'amazon'],
  entertainment: ['movie', 'cinema', 'netflix', 'spotify', 'game', 'concert', 'bowling', 'subscription'],
  health: ['doctor', 'medicine', 'pharmacy', 'hospital', 'gym', 'dentist', 'clinic', 'lab'],
  bills: ['bill', 'electricity', 'gas', 'internet', 'wifi', 'mobile', 'recharge', 'water'],
  housing: ['rent', 'maintenance', 'furniture', 'repair'],
  salary: ['salary', 'paycheck', 'wage'],
  freelance: ['freelance', 'client', 'project'],
  investments: ['dividend', 'interest', 'profit', 'stocks'],
}

const guessCategory = (text, fallback) => {
  const t = text.toLowerCase()
  for (const cat of CATEGORIES) {
    if (t.includes(cat.id) || t.includes(cat.label.toLowerCase())) return cat.id
  }
  for (const [id, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => new RegExp(`\\b${w}`).test(t))) return id
  }
  return fallback
}

const has = (text, ...words) => words.some((w) => text.includes(w))

const parseAmount = (text) => {
  const m = text.match(/(?:rs\.?|pkr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/i)
  if (!m) return null
  let n = parseFloat(m[1].replace(/,/g, ''))
  if (m[2]) n *= 1000
  return Number.isFinite(n) && n > 0 ? n : null
}

const parseDate = (text) => {
  if (/\byesterday\b/.test(text)) {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return toISO(d)
  }
  return todayISO()
}

const periodOf = (t) => {
  if (has(t, 'last month', 'previous month')) return 'last'
  if (has(t, 'week')) return 'week'
  if (has(t, 'today')) return 'today'
  return 'month'
}

const spendInPeriod = (txs, period, categoryId) => {
  const key = currentMonthKey()
  let list
  let label
  if (period === 'last') {
    list = inMonth(txs, shiftMonthKey(key, -1))
    label = 'last month'
  } else if (period === 'week') {
    const from = new Date()
    from.setDate(from.getDate() - 6)
    list = txs.filter((t) => t.date >= toISO(from) && t.date <= todayISO())
    label = 'the last 7 days'
  } else if (period === 'today') {
    list = txs.filter((t) => t.date === todayISO())
    label = 'today'
  } else {
    list = inMonth(txs, key)
    label = 'this month'
  }
  list = expensesOnly(list)
  if (categoryId) list = list.filter((t) => t.category === categoryId)
  return { total: list.reduce((s, t) => s + t.amount, 0), count: list.length, label, list }
}

export const SUGGESTIONS = [
  'How much did I spend this month?',
  'Am I over budget?',
  'Where does my money go?',
  'Give me saving tips',
  'Add 1500 for lunch',
]

const reply = (text, extra = {}) => ({ text, ...extra })

/**
 * A small rule-based assistant over the user's own data.
 * ctx: { transactions, budgets, openingBalance, addTransaction }
 * Returns { text, chips?, action? } - `action` is applied by the UI (e.g. add a transaction).
 */
export const respond = (input, ctx) => {
  const raw = input.trim()
  const t = raw.toLowerCase()
  const { transactions: txs, budgets, openingBalance } = ctx
  const key = currentMonthKey()
  const prevKey = shiftMonthKey(key, -1)

  if (!t) return reply('Type a question about your spending and I will dig into the numbers.')

  // --- add a transaction: "add 1500 for lunch", "spent 800 on uber yesterday", "received 50k salary"
  const isIncome = /\b(received|got paid|earned|income|salary credited)\b/.test(t)
  if (/\b(add|spent|spend|paid|pay|bought|buy|received|earned|got paid)\b/.test(t) && !/\b(how much|what|total|did i)\b/.test(t)) {
    const amount = parseAmount(t)
    if (amount || /^add\b/.test(t)) {
      if (!amount) return reply('I can add that for you - just include an amount, e.g. **"Add 1500 for lunch"** or **"Spent 800 on Careem yesterday"**.')
      const type = isIncome ? 'income' : 'expense'
      const cat = guessCategory(t, type === 'income' ? 'freelance' : 'shopping')
      const catType = getCategory(cat).type
      const finalType = catType === 'income' ? 'income' : type === 'income' ? 'income' : 'expense'
      const title = raw
        .replace(/(?:add|spent|spend|paid|pay|bought|buy|received|earned|got paid)/i, '')
        .replace(/(?:rs\.?|pkr|rupees?)?\s*\d[\d,]*(?:\.\d+)?\s*k?\b/i, '')
        .replace(/\b(on|for|at|to|from|yesterday|today)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const tx = {
        title: title ? title.charAt(0).toUpperCase() + title.slice(1) : getCategory(cat).label,
        amount,
        category: finalType === 'income' && catType !== 'income' ? 'freelance' : cat,
        type: finalType,
        date: parseDate(t),
        method: 'Cash',
        note: 'Added via Fina',
      }
      return reply(
        `Done! I logged **${formatMoney(amount)}** as ${tx.type === 'income' ? 'income' : 'an expense'} under **${getCategory(tx.category).label}** (${relativeDay(tx.date).toLowerCase()}).`,
        { action: { type: 'add', transaction: tx }, chips: ['How much did I spend this month?', 'Am I over budget?'] },
      )
    }
  }

  // --- greetings / thanks / help
  if (/^(hi|hello|hey|salam|assalam|good (morning|afternoon|evening))\b/.test(t)) {
    return reply('Hi there! I am **Fina**, your money assistant. Ask me about your spending, budgets or savings - or tell me to add an expense.', { chips: SUGGESTIONS.slice(0, 3) })
  }
  if (has(t, 'thank', 'thanks', 'shukriya')) return reply('Anytime! Let me know if you want to dig into anything else.')
  if (has(t, 'help', 'what can you do', 'features')) {
    return reply(
      'Here is what I can do:\n• Summarise spending by period or category\n• Check your budgets and warn you early\n• Compare this month with last month\n• Forecast your month-end spend\n• Find your biggest expenses\n• Give personalised saving tips\n• Add transactions - try **"Add 500 for coffee"**',
      { chips: SUGGESTIONS.slice(0, 4) },
    )
  }

  // --- budgets
  if (has(t, 'budget', 'over', 'limit', 'overspend', 'remaining', 'left')) {
    const status = budgetStatus(txs, budgets, key)
    const catMatch = EXPENSE_CATEGORIES.find((c) => t.includes(c.id) || t.includes(c.label.toLowerCase()))
    if (catMatch) {
      const s = status.find((x) => x.id === catMatch.id)
      if (!s.limit) return reply(`You haven't set a budget for **${s.label}** yet. You can add one on the Budget page.`)
      return reply(
        s.remaining >= 0
          ? `**${s.label}**: ${formatMoney(s.used)} of ${formatMoney(s.limit)} used (${Math.round(s.pct)}%). You have **${formatMoney(s.remaining)}** left this month.`
          : `**${s.label}** is over budget: ${formatMoney(s.used)} spent against a ${formatMoney(s.limit)} limit - **${formatMoney(-s.remaining)}** over.`,
      )
    }
    const over = status.filter((s) => s.state === 'over')
    const near = status.filter((s) => s.state === 'near')
    const totalLimit = status.reduce((a, s) => a + s.limit, 0)
    const totalUsed = status.reduce((a, s) => a + s.used, 0)
    let text = `Overall you've used **${formatMoney(totalUsed)}** of your **${formatMoney(totalLimit)}** monthly budget (${Math.round((totalUsed / totalLimit) * 100)}%).`
    if (over.length) text += `\n\n🚨 Over budget:\n${over.map((s) => `• **${s.label}** - ${formatMoney(s.used - s.limit)} over`).join('\n')}`
    if (near.length) text += `\n\n⚠️ Close to the limit:\n${near.map((s) => `• **${s.label}** - ${Math.round(s.pct)}% used`).join('\n')}`
    if (!over.length && !near.length) text += '\n\n✅ Every category is comfortably within budget.'
    return reply(text, { chips: ['Give me saving tips', 'Forecast my month-end spend'] })
  }

  // --- forecast
  if (has(t, 'forecast', 'predict', 'projection', 'project', 'month-end', 'month end', 'end of month', 'on track')) {
    const { projected, spent, day, total } = projectedMonthSpend(txs)
    const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0)
    const diff = totalBudget - projected
    return reply(
      `You've spent **${formatMoney(spent)}** in ${day} of ${total} days. At this pace you'll land around **${formatMoney(projected)}** by month-end - ${diff >= 0 ? `about **${formatMoney(diff)} under**` : `about **${formatMoney(-diff)} over**`} your total budget.`,
      { chips: ['Am I over budget?', 'Give me saving tips'] },
    )
  }

  // --- compare (month-to-date vs the same days of last month)
  if (has(t, 'compare', 'vs', 'versus', 'difference', 'than last', 'last month') && has(t, 'compare', 'vs', 'versus', 'difference', 'than', 'more', 'less')) {
    const day = Number(todayISO().slice(8, 10))
    const cur = monthTotals(txs, key)
    const prevSame = monthTotals(txs, prevKey, day)
    const prevFull = monthTotals(txs, prevKey)
    const change = percentChange(cur.expense, prevSame.expense)
    const curCats = Object.fromEntries(spendByCategory(txs, key).map((c) => [c.id, c.value]))
    const prevCats = Object.fromEntries(spendByCategory(txs, prevKey, day).map((c) => [c.id, c.value]))
    const moves = EXPENSE_CATEGORIES.map((c) => ({ label: c.label, delta: (curCats[c.id] || 0) - (prevCats[c.id] || 0) }))
      .filter((m) => m.delta !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3)
    const movers = moves.map((m) => `• **${m.label}** ${m.delta >= 0 ? '▲' : '▼'} ${formatMoney(Math.abs(m.delta))}`).join('\n')
    return reply(
      `In the first ${day} days of this month you've spent **${formatMoney(cur.expense)}**, versus **${formatMoney(prevSame.expense)}** over the same days of ${monthLabel(prevKey, 'long')} - ${change >= 0 ? 'up' : 'down'} **${Math.abs(Math.round(change))}%**. (All of last month: ${formatMoney(prevFull.expense)}.)` +
        (moves.length ? `\n\nBiggest movers:\n${movers}` : ''),
    )
  }

  // --- biggest expenses
  if (has(t, 'biggest', 'largest', 'highest', 'top expense', 'most expensive')) {
    const top = expensesOnly(inMonth(txs, key)).sort((a, b) => b.amount - a.amount).slice(0, 3)
    if (!top.length) return reply('No expenses recorded this month yet.')
    return reply(`Your biggest expenses this month:\n${top.map((x, i) => `${i + 1}. **${x.title}** - ${formatMoney(x.amount)} (${relativeDay(x.date)})`).join('\n')}`)
  }

  // --- recent transactions
  if (has(t, 'recent', 'latest', 'last transaction', 'last purchase', 'transactions')) {
    const recent = txs.slice(0, 5)
    return reply(`Your latest activity:\n${recent.map((x) => `• ${x.type === 'income' ? '💰' : '🧾'} **${x.title}** - ${x.type === 'income' ? '+' : '-'}${formatMoney(x.amount)} (${relativeDay(x.date)})`).join('\n')}`)
  }

  // --- where does my money go / top category / breakdown
  if (has(t, 'where', 'breakdown', 'top category', 'most', 'categories', 'biggest category', 'go on')) {
    const cats = spendByCategory(txs, key)
    if (!cats.length) return reply('No spending recorded this month yet.')
    const total = cats.reduce((a, c) => a + c.value, 0)
    return reply(
      `Here's where your money went this month (${formatMoney(total)} total):\n${cats.slice(0, 5).map((c) => `• **${c.label}** - ${formatMoney(c.value)} (${Math.round((c.value / total) * 100)}%)`).join('\n')}`,
      { chips: ['Compare with last month', 'Give me saving tips'] },
    )
  }

  // --- balance / savings / income
  if (has(t, 'balance', 'net worth', 'how much do i have')) {
    return reply(`Your total balance is **${formatMoney(totalBalance(txs, openingBalance))}**.`)
  }
  if (has(t, 'saving rate', 'savings rate', 'saved', 'how much am i saving', 'savings')) {
    const cur = monthTotals(txs, key)
    const prev = monthTotals(txs, prevKey)
    return reply(
      `This month you've earned **${formatMoney(cur.income)}** and spent **${formatMoney(cur.expense)}**, saving **${formatMoney(cur.savings)}** (${Math.round(cur.savingsRate)}%). Last month's savings rate was **${Math.round(prev.savingsRate)}%**.`,
    )
  }
  if (has(t, 'income', 'earn', 'earned')) {
    const cur = monthTotals(txs, key)
    return reply(`You've earned **${formatMoney(cur.income)}** so far this month.`)
  }

  // --- tips
  if (has(t, 'tip', 'advice', 'save', 'reduce', 'cut', 'suggest', 'improve')) {
    const status = budgetStatus(txs, budgets, key).sort((a, b) => b.pct - a.pct)
    const worst = status[0]
    const tips = []
    if (worst && worst.pct >= 80) tips.push(`**${worst.label}** is at ${Math.round(worst.pct)}% of its budget - set a weekly cap for it.`)
    const dining = spendInPeriod(txs, 'month', 'dining')
    if (dining.total > 0) tips.push(`You've spent ${formatMoney(dining.total)} on dining. Cooking at home 2 more days a week could save ~**${formatMoney(dining.total * 0.25)}**.`)
    tips.push('Automate savings: move 20% of your salary to a separate account on payday.')
    tips.push('Review subscriptions every quarter - cancel anything you haven\'t used in 30 days.')
    tips.push('Try a 24-hour rule for non-essential purchases above Rs. 5,000.')
    return reply(`Here are my top tips for you:\n${tips.slice(0, 4).map((x, i) => `${i + 1}. ${x}`).join('\n')}`, { chips: ['Am I over budget?', 'Forecast my month-end spend'] })
  }

  // --- spending totals (period and/or category aware)
  if (has(t, 'spend', 'spent', 'spending', 'expense', 'cost', 'how much')) {
    const catId = guessCategory(t, null)
    const cat = catId && getCategory(catId).type === 'expense' ? catId : null
    const period = periodOf(t)
    const r = spendInPeriod(txs, period, cat)
    const subject = cat ? `on **${getCategory(cat).label}**` : 'in total'
    if (!r.count) return reply(`I don't see any ${cat ? getCategory(cat).label.toLowerCase() + ' ' : ''}expenses for ${r.label}.`)
    let text = `You've spent **${formatMoney(r.total)}** ${subject} ${r.label} across ${r.count} transaction${r.count > 1 ? 's' : ''}.`
    if (period === 'month' && !cat) {
      const change = percentChange(r.total, monthTotals(txs, prevKey, Number(todayISO().slice(8, 10))).expense)
      text += `\n\nThat's ${Math.round(Math.abs(change))}% ${change >= 0 ? 'more' : 'less'} than the same days last month.`
    }
    return reply(text, { chips: ['Where does my money go?', 'Am I over budget?'] })
  }

  // --- bare category mention
  const bare = guessCategory(t, null)
  if (bare && getCategory(bare).type === 'expense') {
    const r = spendInPeriod(txs, 'month', bare)
    return reply(`**${getCategory(bare).label}** this month: ${formatMoney(r.total)} across ${r.count} transaction${r.count === 1 ? '' : 's'}.`)
  }

  return reply("I didn't quite catch that. I can answer questions about your spending, budgets, savings, forecasts - or add an expense for you. Try one of these:", { chips: SUGGESTIONS.slice(0, 4) })
}
