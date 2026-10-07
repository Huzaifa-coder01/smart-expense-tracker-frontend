import React, { useRef, useState } from 'react'

// Six single-digit boxes. Supports typing, backspace, arrow keys, paste and SMS/email autofill.
// Remount (change `key`) to clear it.
const OtpInput = ({ length = 6, onChange, disabled = false }) => {
  const [digits, setDigits] = useState(() => Array(length).fill(''))
  const refs = useRef([])

  const commit = (next) => {
    setDigits(next)
    onChange(next.join(''))
  }

  const handleChange = (i, raw) => {
    const chars = raw.replace(/\D/g, '').slice(0, length - i).split('')
    const next = digits.slice()
    if (chars.length === 0) {
      next[i] = ''
      return commit(next)
    }
    chars.forEach((c, k) => {
      next[i + k] = c
    })
    commit(next)
    refs.current[Math.min(i + chars.length, length - 1)]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      const next = digits.slice()
      next[i - 1] = ''
      commit(next)
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus()
    }
  }

  return (
    <div className='flex justify-between gap-2' role='group' aria-label='One-time code'>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          disabled={disabled}
          inputMode='numeric'
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className='field h-12 w-full min-w-0 px-0! text-center text-lg! font-semibold'
        />
      ))}
    </div>
  )
}

export default OtpInput
