import { shiftMonthKey, currentMonthKey, daysInMonth, todayISO } from '../utils/format'

export const USER = {
  name: 'Huzaifa',
  fullName: 'Huzaifa Nadeem',
  email: 'huzaifanadeemtts@gmail.com',
  plan: 'Pro',
}

export const OPENING_BALANCE = 420000

export const DEFAULT_BUDGETS = {
  housing: 62000,
  groceries: 38000,
  dining: 20000,
  transport: 18000,
  bills: 24000,
  shopping: 22000,
  entertainment: 10000,
  health: 10000,
}

// Small deterministic PRNG so the demo data is stable between reloads
const mulberry32 = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const MERCHANTS = {
  groceries: ['Imtiaz Supermarket', 'Carrefour', 'Al-Fatah Store', 'Naheed Supermarket', 'Metro Cash & Carry'],
  dining: ['Foodpanda', 'Kolachi Restaurant', 'Cafe Aylanto', 'Hardee\'s', 'Savour Foods', 'Gloria Jean\'s Coffees'],
  transport: ['Careem Ride', 'Uber Ride', 'Shell Fuel', 'PSO Fuel', 'inDrive Ride', 'Bykea'],
  shopping: ['Daraz Order', 'Khaadi', 'Sapphire', 'Outfitters', 'Bata Shoes', 'Gul Ahmed'],
  entertainment: ['Cinepax Tickets', 'Netflix', 'Spotify Premium', 'PlayStation Store', 'Bowling Night'],
  health: ['Shaukat Khanum Pharmacy', 'DVAGO Pharmacy', 'Aga Khan Lab', 'Gym Membership', 'Dental Clinic'],
}

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)]
const between = (rand, min, max, step = 50) => Math.round((min + rand() * (max - min)) / step) * step

export const generateTransactions = () => {
  const rand = mulberry32(20261007)
  const today = todayISO()
  const thisMonth = currentMonthKey()
  const list = []
  let id = 1

  const add = (monthKey, day, title, amount, category, type, method = 'Card', note = '') => {
    const d = Math.min(day, daysInMonth(monthKey))
    const date = `${monthKey}-${String(d).padStart(2, '0')}`
    if (date > today) return // never generate future transactions
    list.push({ id: `t${id++}`, title, amount, category, type, date, method, note })
  }

  for (let back = 5; back >= 0; back--) {
    const mk = shiftMonthKey(thisMonth, -back)

    // income
    add(mk, 1, 'Monthly Salary', 245000, 'salary', 'income', 'Bank Transfer', 'Tech Solutions Pvt. Ltd.')
    if (rand() > 0.35) add(mk, between(rand, 8, 24, 1), 'Freelance Project', between(rand, 25000, 55000, 500), 'freelance', 'income', 'Bank Transfer')
    if (rand() > 0.6) add(mk, 20, 'Mutual Fund Dividend', between(rand, 6000, 12000, 100), 'investments', 'income', 'Bank Transfer')

    // fixed costs
    add(mk, 3, 'Apartment Rent', 55000, 'housing', 'expense', 'Bank Transfer', 'Monthly rent')
    add(mk, 4, 'Maintenance Charges', 3000, 'housing', 'expense', 'Cash')
    add(mk, 10, 'K-Electric Bill', between(rand, 8500, 15500, 100), 'bills', 'expense', 'Bank Transfer')
    add(mk, 11, 'SNGPL Gas Bill', between(rand, 1500, 4000, 50), 'bills', 'expense', 'Bank Transfer')
    add(mk, 12, 'PTCL Internet', 3500, 'bills', 'expense', 'Card')
    add(mk, 13, 'Mobile Package', 2500, 'bills', 'expense', 'JazzCash')
    add(mk, 15, 'Netflix', 1800, 'entertainment', 'expense', 'Card', 'Subscription')
    add(mk, 15, 'Spotify Premium', 600, 'entertainment', 'expense', 'Card', 'Subscription')
    add(mk, 2, 'Gym Membership', 5000, 'health', 'expense', 'Card', 'Subscription')

    // variable spending
    const spread = (cat, count, min, max, step, method) => {
      for (let i = 0; i < count; i++) {
        add(mk, 1 + Math.floor(rand() * 30), pick(rand, MERCHANTS[cat]), between(rand, min, max, step), cat, 'expense', method || pick(rand, ['Card', 'Cash', 'Easypaisa']))
      }
    }
    spread('groceries', 6, 3200, 7800, 50)
    spread('dining', 6, 1400, 4800, 50)
    spread('transport', 9, 450, 3200, 50)
    spread('shopping', back % 2 === 0 ? 3 : 2, 3500, 14000, 100, 'Card')
    spread('entertainment', 2, 1500, 4500, 50)
    if (rand() > 0.4) spread('health', 1, 2500, 7500, 100)
  }

  return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

