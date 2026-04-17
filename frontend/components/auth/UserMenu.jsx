'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function UserMenu({ onOpenProfile, onOpenHistory, onOpenFavorites }) {
  const { user, profile, signOut, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (loading || !user) return null

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.slice(0, 2).toUpperCase() || '??'
  }

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
  }

  const handleMenuClick = (action) => {
    setIsOpen(false)
    action()
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center transition-all"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: profile?.avatar_url
            ? `url(${profile.avatar_url})`
            : 'var(--color-bg-elevated)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid var(--color-border-default)',
          color: 'var(--color-text-accent)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
        aria-label="User menu"
      >
        {!profile?.avatar_url && getInitials()}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 animate-scale-in"
          style={{
            background: 'var(--color-bg-overlay)',
            border: '1px solid var(--color-border-default)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            transformOrigin: 'top right',
            zIndex: 1000,
          }}
        >
          {/* User Info */}
          <div
            className="px-4 py-3 border-b"
            style={{
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div
              className="text-sm font-medium truncate"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
              }}
            >
              {profile?.full_name || 'User'}
            </div>
            <div
              className="text-xs truncate mt-0.5"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {user.email}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => handleMenuClick(onOpenProfile)}
              className="w-full px-4 py-2 text-left text-sm transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--color-bg-elevated)'
                e.target.style.color = 'var(--color-text-accent)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = 'var(--color-text-primary)'
              }}
            >
              Profile
            </button>

            <button
              onClick={() => handleMenuClick(onOpenHistory)}
              className="w-full px-4 py-2 text-left text-sm transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--color-bg-elevated)'
                e.target.style.color = 'var(--color-text-accent)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = 'var(--color-text-primary)'
              }}
            >
              Search History
            </button>

            <button
              onClick={() => handleMenuClick(onOpenFavorites)}
              className="w-full px-4 py-2 text-left text-sm transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--color-bg-elevated)'
                e.target.style.color = 'var(--color-text-accent)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = 'var(--color-text-primary)'
              }}
            >
              Favorites
            </button>

            <div
              className="my-2 h-px"
              style={{
                background: 'var(--color-border-default)',
                marginLeft: '16px',
                marginRight: '16px',
              }}
            />

            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-secondary)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--color-bg-elevated)'
                e.target.style.color = 'var(--color-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = 'var(--color-text-secondary)'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
