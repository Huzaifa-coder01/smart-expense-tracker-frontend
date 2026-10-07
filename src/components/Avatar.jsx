import React from 'react'

const SIZES = { md: 'h-9 w-9 text-sm', lg: 'h-14 w-14 text-xl' }

export const Avatar = ({ user, size = 'md', className = '' }) => {
  const cls = `grid shrink-0 place-items-center rounded-full bg-brand font-bold text-white ${SIZES[size]} ${className}`
  if (user.photoURL) {
    return <img src={user.photoURL} alt='' referrerPolicy='no-referrer' className={`${cls} object-cover`} />
  }
  return <span className={cls}>{(user.name || '?')[0].toUpperCase()}</span>
}
