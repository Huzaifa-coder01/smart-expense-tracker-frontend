import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowPathIcon, PaperAirplaneIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { useExpenses } from '../context/ExpenseContext'
import { respond, SUGGESTIONS } from '../utils/chatEngine'

const WELCOME = {
  id: 'welcome',
  from: 'bot',
  text: "Hi! I'm **Fina**, your AI money assistant ✨\nAsk me about your spending, budgets or savings - or just say **\"Add 500 for coffee\"** and I'll log it.",
  chips: SUGGESTIONS,
}

// Renders **bold** and newlines
const RichText = ({ text }) => (
  <>
    {text.split('\n').map((line, i) => (
      <p key={i} className={i ? 'mt-1.5' : ''}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith('**') ? <strong key={j} className='font-semibold'>{part.slice(2, -2)}</strong> : <React.Fragment key={j}>{part}</React.Fragment>,
        )}
      </p>
    ))}
  </>
)

const TypingDots = () => (
  <div className='flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3'>
    {[0, 1, 2].map((i) => (
      <motion.span key={i} className='h-1.5 w-1.5 rounded-full bg-muted' animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
    ))}
  </div>
)

const Chatbot = ({ open, onToggle }) => {
  const ctx = useExpenses()
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const ctxRef = useRef(ctx)
  const timer = useRef(null)

  useEffect(() => {
    ctxRef.current = ctx
  }, [ctx])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, typing, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250)
  }, [open])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && open && onToggle()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onToggle])

  useEffect(() => () => clearTimeout(timer.current), [])

  const send = (text) => {
    const value = text.trim()
    if (!value || typing) return
    setMessages((m) => [...m.map((x) => ({ ...x, chips: undefined })), { id: `u${Date.now()}`, from: 'user', text: value }])
    setInput('')
    setTyping(true)
    timer.current = setTimeout(() => {
      const result = respond(value, ctxRef.current)
      if (result.action?.type === 'add') {
        ctxRef.current.addTransaction(result.action.transaction)
        toast.success('Transaction added by Fina')
      }
      setMessages((m) => [...m, { id: `b${Date.now()}`, from: 'bot', text: result.text, chips: result.chips }])
      setTyping(false)
    }, 600 + Math.random() * 500)
  }

  const reset = () => {
    clearTimeout(timer.current)
    setTyping(false)
    setMessages([WELCOME])
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            role='dialog'
            aria-label='Fina assistant'
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className='fixed inset-0 z-50 flex origin-bottom-right flex-col overflow-hidden border-line bg-surface sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[600px] sm:max-h-[calc(100vh-8rem)] sm:w-[400px] sm:rounded-3xl sm:border sm:shadow-2xl sm:shadow-indigo-950/20'
          >
            <header className='flex items-center gap-3 bg-brand px-4 py-3.5 text-white'>
              <span className='grid h-10 w-10 place-items-center rounded-full bg-white/20'>
                <SparklesIcon className='h-5 w-5' />
              </span>
              <div className='leading-tight'>
                <p className='font-semibold'>Fina</p>
                <p className='flex items-center gap-1.5 text-xs text-white/80'>
                  <span className='h-1.5 w-1.5 rounded-full bg-emerald-300' /> AI money assistant
                </p>
              </div>
              <div className='ml-auto flex items-center'>
                <button onClick={reset} className='rounded-lg p-2 hover:bg-white/15' aria-label='Clear conversation' title='New chat'>
                  <ArrowPathIcon className='h-5 w-5' />
                </button>
                <button onClick={onToggle} className='rounded-lg p-2 hover:bg-white/15' aria-label='Close assistant'>
                  <XMarkIcon className='h-5 w-5' />
                </button>
              </div>
            </header>

            <div className='flex-1 space-y-3 overflow-y-auto bg-bg/60 px-4 py-4'>
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.from === 'user' ? 'flex justify-end' : 'flex'}>
                  <div className='max-w-[88%]'>
                    <div
                      className={`px-4 py-2.5 text-sm leading-relaxed ${m.from === 'user' ? 'rounded-2xl rounded-br-md bg-brand text-white' : 'rounded-2xl rounded-bl-md border border-line bg-surface'}`}
                    >
                      <RichText text={m.text} />
                    </div>
                    {m.chips && (
                      <div className='mt-2 flex flex-wrap gap-1.5'>
                        {m.chips.map((c) => (
                          <button
                            key={c}
                            onClick={() => send(c)}
                            className='rounded-full border border-indigo-500/30 bg-indigo-500/8 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-500/15 dark:text-indigo-300'
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {typing && <TypingDots />}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className='flex items-center gap-2 border-t border-line bg-surface p-3'
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Ask about your spending…'
                className='field flex-1 rounded-full! px-4!'
                aria-label='Message Fina'
              />
              <button
                type='submit'
                disabled={!input.trim() || typing}
                className='grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-40'
                aria-label='Send'
              >
                <PaperAirplaneIcon className='h-5 w-5' />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`fixed bottom-5 right-5 z-[45] h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-xl shadow-indigo-500/40 sm:bottom-6 sm:right-6 ${open ? 'hidden sm:grid' : 'grid'}`}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {!open && <span className='absolute inset-0 animate-ping rounded-full bg-indigo-500/30 [animation-duration:2.5s]' />}
        {open ? <XMarkIcon className='relative h-6 w-6' /> : <SparklesIcon className='relative h-6 w-6' />}
      </motion.button>
    </>
  )
}

export default Chatbot
