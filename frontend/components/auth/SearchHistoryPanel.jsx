'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function SearchHistoryPanel({ isOpen, onClose, onQuerySelect }) {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory()
    }
  }, [isOpen, user])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/history')
      if (!response.ok) throw new Error('Failed to fetch history')
      const data = await response.json()
      setHistory(data.history || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all search history?')) return

    try {
      const response = await fetch('/api/history', { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to clear history')
      setHistory([])
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteItem = async (id) => {
    try {
      const response = await fetch(`/api/history?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete item')
      setHistory(history.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000]"
        onClick={onClose}
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[1001] overflow-y-auto animate-slide-in-right"
        style={{
          background: 'var(--color-bg-base)',
          borderLeft: '1px solid var(--color-border-default)',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5 border-b flex items-center justify-between"
          style={{
            background: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <h2
            className="text-2xl"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-primary)',
              fontWeight: 300,
            }}
          >
            Search History
          </h2>
          <button
            onClick={onClose}
            className="text-xl transition-all"
            style={{
              color: 'var(--color-text-secondary)',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-6 h-6" />
            </div>
          )}

          {error && (
            <div
              className="p-4 text-sm mb-4"
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

          {!loading && history.length === 0 && (
            <div className="text-center py-12">
              <div
                className="text-6xl mb-4"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                ⌛
              </div>
              <p
                className="text-lg mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                No search history yet
              </p>
              <p
                className="text-sm"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Your searches will appear here
              </p>
            </div>
          )}

          {!loading && history.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-sm"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {history.length} {history.length === 1 ? 'search' : 'searches'}
                </p>
                <button
                  onClick={handleClearAll}
                  className="text-sm transition-all"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group p-4 transition-all cursor-pointer border"
                    style={{
                      background: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-default)',
                    }}
                    onClick={() => {
                      onQuerySelect(item.query)
                      onClose()
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p
                          className="text-sm mb-1"
                          style={{
                            fontFamily: 'var(--font-body)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {item.query}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          {item.intent && (
                            <span
                              className="px-2 py-0.5"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--color-text-accent)',
                                background: 'var(--color-bg-accent)',
                                border: '1px solid var(--color-border-accent)',
                              }}
                            >
                              {item.intent}
                            </span>
                          )}
                          <span
                            style={{
                              fontFamily: 'var(--font-body)',
                              color: 'var(--color-text-tertiary)',
                            }}
                          >
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteItem(item.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                        style={{
                          color: 'var(--color-text-secondary)',
                        }}
                        aria-label="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  )
}
