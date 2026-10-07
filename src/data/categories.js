import {
  HomeIcon,
  ShoppingCartIcon,
  CakeIcon,
  TruckIcon,
  BoltIcon,
  ShoppingBagIcon,
  FilmIcon,
  HeartIcon,
  BanknotesIcon,
  ComputerDesktopIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

// Expense colours follow the validated categorical palette (fixed slot order).
// `color` is for light surfaces, `dark` for dark surfaces.
export const CATEGORIES = [
  { id: 'housing', label: 'Housing', type: 'expense', color: '#2a78d6', dark: '#3987e5', icon: HomeIcon },
  { id: 'dining', label: 'Dining', type: 'expense', color: '#eb6834', dark: '#d95926', icon: CakeIcon },
  { id: 'groceries', label: 'Groceries', type: 'expense', color: '#1baf7a', dark: '#199e70', icon: ShoppingCartIcon },
  { id: 'shopping', label: 'Shopping', type: 'expense', color: '#eda100', dark: '#c98500', icon: ShoppingBagIcon },
  { id: 'bills', label: 'Bills', type: 'expense', color: '#e87ba4', dark: '#d55181', icon: BoltIcon },
  { id: 'transport', label: 'Transport', type: 'expense', color: '#008300', dark: '#008300', icon: TruckIcon },
  { id: 'entertainment', label: 'Entertainment', type: 'expense', color: '#4a3aa7', dark: '#9085e9', icon: FilmIcon },
  { id: 'health', label: 'Health', type: 'expense', color: '#e34948', dark: '#e66767', icon: HeartIcon },

  { id: 'salary', label: 'Salary', type: 'income', color: '#2a78d6', dark: '#3987e5', icon: BanknotesIcon },
  { id: 'freelance', label: 'Freelance', type: 'income', color: '#1baf7a', dark: '#199e70', icon: ComputerDesktopIcon },
  { id: 'investments', label: 'Investments', type: 'income', color: '#4a3aa7', dark: '#9085e9', icon: ArrowTrendingUpIcon },
]

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.type === 'expense')
export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.type === 'income')

const byId = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export const getCategory = (id) => byId[id] || EXPENSE_CATEGORIES[0]
export const categoryColor = (id, dark) => {
  const c = getCategory(id)
  return dark ? c.dark : c.color
}

export const PAYMENT_METHODS = ['Card', 'Cash', 'Bank Transfer', 'JazzCash', 'Easypaisa']
