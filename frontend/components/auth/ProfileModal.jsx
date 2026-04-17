'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfileModal({ isOpen, onClose }) {
  const { user, profile, updateProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen && profile) {
      setFullName(profile.full_name || '')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, profile])

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
    setLoading(true)

    try {
      const { error } = await updateProfile({ full_name: fullName })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center"
        onClick={onClose}
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Modal */}
        <div
          className="relative w-full max-w-[480px] p-8 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--color-bg-overlay)',
            border: '1px solid var(--color-border-default)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Header */}
          <div className="mb-6">
            <h2
              className="text-3xl mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontWeight: 300,
              }}
            >
              Edit Profile
            </h2>
            <p
              className="text-sm"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Update your profile information
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label
                className="block text-sm mb-2"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full h-12 px-4 bg-elevated outline-none"
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-default)',
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-body)',
                  cursor: 'not-allowed',
                }}
              />
              <p
                className="mt-1 text-xs"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Email cannot be changed
              </p>
            </div>

            {profile?.created_at && (
              <div>
                <label
                  className="block text-sm mb-2"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Member Since
                </label>
                <div
                  className="text-sm"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}

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
                Profile updated successfully!
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 h-12 transition-all"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border-default)',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 400,
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !fullName.trim()}
                className="flex-1 h-12 transition-all"
                style={{
                  background:
                    !loading && fullName.trim()
                      ? 'var(--color-text-accent)'
                      : 'var(--color-bg-elevated)',
                  color:
                    !loading && fullName.trim()
                      ? '#0a0a0a'
                      : 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor:
                    !loading && fullName.trim()
                      ? 'var(--color-text-accent)'
                      : 'var(--color-border-default)',
                  cursor: !loading && fullName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="spinner w-4 h-4" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
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
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  )
}
