import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowRightStartOnRectangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Button, PageHeader } from '../components/ui'
import { Avatar } from '../components/Avatar'
import { useAuth, authErrorMessage } from '../context/AuthContext'
import { useExpenses } from '../context/ExpenseContext'

const Profile = () => {
  const { user, updateName, signOut } = useAuth()
  const { transactions, resetDemoData } = useExpenses()
  const navigate = useNavigate()
  const [name, setName] = useState(user.guest ? '' : user.fullName)
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Name cannot be empty')
    setSaving(true)
    try {
      await updateName(name.trim())
      toast.success('Profile updated')
    } catch (err) {
      toast.error(authErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const logout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <PageHeader title='Profile' subtitle='Manage your account and data.' />

      <div className='grid gap-6 lg:grid-cols-3'>
        <section className='card p-6 lg:col-span-2'>
          <div className='flex items-center gap-4'>
            <Avatar user={user} size='lg' />
            <div className='min-w-0'>
              <p className='truncate text-lg font-semibold'>{user.fullName}</p>
              <p className='truncate text-sm text-muted'>{user.guest ? 'Guest session - demo data on this device only' : user.email}</p>
            </div>
          </div>

          {user.guest ? (
            <div className='mt-6 rounded-xl bg-surface-2 p-4 text-sm'>
              You&apos;re browsing as a guest. Create an account or sign in to keep your data under your own login.
              <Button onClick={logout} className='mt-3'>Sign in / Create account</Button>
            </div>
          ) : (
            <form onSubmit={save} className='mt-6 space-y-4'>
              <div>
                <label htmlFor='display-name' className='mb-1.5 block text-sm font-medium'>Display name</label>
                <input id='display-name' value={name} onChange={(e) => setName(e.target.value)} className='field' />
              </div>
              <div>
                <label htmlFor='profile-email' className='mb-1.5 block text-sm font-medium'>Email</label>
                <input id='profile-email' value={user.email} disabled className='field opacity-60' />
              </div>
              <Button type='submit' disabled={saving || name.trim() === user.fullName}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </form>
          )}
        </section>

        <section className='card h-fit space-y-4 p-6'>
          <div>
            <p className='text-sm font-semibold'>Your data</p>
            <p className='mt-1 text-sm text-muted'>{transactions.length} transactions stored on this device.</p>
          </div>
          <Button
            variant='secondary'
            className='w-full'
            onClick={() => {
              if (window.confirm('Replace your data with fresh demo data?')) {
                resetDemoData()
                toast.success('Demo data reset')
              }
            }}
          >
            <ArrowPathIcon className='h-4 w-4' /> Reset demo data
          </Button>
          <Button variant='danger' className='w-full' onClick={logout}>
            <ArrowRightStartOnRectangleIcon className='h-4 w-4' /> Sign out
          </Button>
        </section>
      </div>
    </>
  )
}

export default Profile
