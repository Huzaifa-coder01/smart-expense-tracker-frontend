import React, { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Chatbot from './Chatbot'
import { useTheme } from '../context/ThemeContext'

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const { pathname } = useLocation()
  const { dark } = useTheme()

  const toggleChat = useCallback(() => setChatOpen((o) => !o), [])

  return (
    <div className='min-h-screen'>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} onOpenChat={() => setChatOpen(true)} />
      <div className='lg:pl-64'>
        <Navbar onMenu={() => setMenuOpen(true)} />
        <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
          <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
      <Chatbot open={chatOpen} onToggle={toggleChat} />
      <ToastContainer position='top-right' autoClose={2800} theme={dark ? 'dark' : 'light'} hideProgressBar closeButton={false} />
    </div>
  )
}

export default Layout
