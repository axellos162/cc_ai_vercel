'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthModal({ isOpen, onClose, initialTab = 'signin' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const { signIn, signUp, signInWithGoogle } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      setEmail('')
      setPassword('')
      setFullName('')
      setError(null)
      setSuccess(null)
    }
  }, [isOpen, initialTab])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (activeTab === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
        onClose()
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setSuccess('Account created! You can now sign in.')
        setTimeout(() => {
          setActiveTab('signin')
          setSuccess(null)
        }, 2000)
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)

    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
    } catch (err) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const canSubmit = () => {
    if (!isValidEmail(email) || password.length < 8) return false
    if (activeTab === 'signup' && !fullName.trim()) return false
    return true
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center"
        onClick={onClose}
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Modal */}
        <div
          className="relative w-full max-w-[480px] p-8 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-default)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <h2
              className="text-3xl mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontWeight: 300,
              }}
            >
              {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p
              className="text-sm"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {activeTab === 'signin'
                ? 'Sign in to save your favorites and search history'
                : 'Join to start saving your favorite products and brands'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className="pb-3 px-1 text-sm transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: activeTab === 'signin' ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'signin' ? '2px solid var(--color-text-accent)' : '2px solid transparent',
                fontWeight: activeTab === 'signin' ? 500 : 400,
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className="pb-3 px-1 text-sm transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: activeTab === 'signup' ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'signup' ? '2px solid var(--color-text-accent)' : '2px solid transparent',
                fontWeight: activeTab === 'signup' ? 500 : 400,
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm mb-2"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 px-4 bg-elevated outline-none transition-all"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-body)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-border-accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border-default)')}
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm mb-2"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full h-12 px-4 bg-elevated outline-none transition-all"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-border-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border-default)')}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm mb-2"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Password {activeTab === 'signup' && <span className="text-xs">(min. 8 characters)</span>}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full h-12 px-4 bg-elevated outline-none transition-all"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-border-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border-default)')}
                required
              />
            </div>

            {error && (
              <div
                className="p-3 text-sm"
                style={{
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  color: '#fca5a5',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="p-3 text-sm"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#86efac',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit() || loading}
              className="w-full h-12 transition-all"
              style={{
                background: canSubmit() && !loading ? 'var(--color-text-accent)' : 'var(--color-bg-elevated)',
                color: canSubmit() && !loading ? '#0a0a0a' : 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                border: '1px solid',
                borderColor: canSubmit() && !loading ? 'var(--color-text-accent)' : 'var(--color-border-default)',
                cursor: canSubmit() && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4" />
                  <span>Please wait...</span>
                </div>
              ) : (
                activeTab === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border-default)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
                OR
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border-default)' }} />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-3 transition-all"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9.003 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.48 0 2.438 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
                />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .spinner {
          border: 2px solid var(--color-border-subtle);
          border-top: 2px solid var(--color-text-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
