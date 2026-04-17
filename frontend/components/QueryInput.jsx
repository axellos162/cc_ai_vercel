'use client'

import { useState } from 'react'

export default function QueryInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "What are you looking for?",
  variant = "centered"
}) {
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && value.trim()) {
      onSubmit(value)
    }
  }

  const handleSubmitClick = () => {
    if (!isLoading && value.trim()) {
      onSubmit(value)
    }
  }

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)

  // Bottom variant gets custom styling
  if (variant === "bottom") {
    return (
      <div
        style={{
          width: '100%',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--color-bg-elevated)',
          border: `1px solid ${isFocused ? 'var(--color-border-accent)' : 'var(--color-border-default)'}`,
          borderRadius: '0',
          boxShadow: isFocused ? '0 0 0 1px rgba(139, 115, 85, 0.2)' : 'none',
          transition: 'border-color 200ms, box-shadow 200ms'
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 h-full px-4 bg-transparent text-base font-body text-text-primary placeholder:text-text-tertiary outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={isLoading || !value.trim()}
          className="h-full px-3 flex items-center justify-center text-text-secondary hover:text-text-accent disabled:opacity-50 transition-colors duration-200"
          aria-label="Submit query"
        >
          {isLoading ? (
            <div className="spinner w-5 h-5" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 10H16M16 10L11 5M16 10L11 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <style jsx>{`
          .spinner {
            border: 2px solid var(--color-border-subtle);
            border-top: 2px solid var(--color-text-secondary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Centered variant with enhanced styling
  return (
    <div
      className="query-input-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: '64px'
      }}
    >
      <div
        className="query-input-container"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--color-bg-elevated)',
          border: `1px solid ${isFocused ? 'var(--color-border-accent)' : 'var(--color-border-default)'}`,
          borderRadius: '0',
          boxShadow: isFocused ? '0 0 0 1px rgba(201, 185, 154, 0.2), 0 8px 24px rgba(0, 0, 0, 0.2)' : 'none',
          transition: 'all var(--transition-base)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, var(--color-text-accent), transparent)',
            opacity: isFocused ? 1 : 0,
            transform: isFocused ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
            transition: 'all 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 h-full px-5 bg-transparent text-base font-body text-text-primary placeholder:text-text-tertiary outline-none disabled:opacity-50"
          style={{
            letterSpacing: '0.02em'
          }}
        />
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={isLoading || !value.trim()}
          className="h-full px-4 flex items-center justify-center text-text-secondary hover:text-text-accent disabled:opacity-30 transition-all duration-300"
          aria-label="Submit query"
          style={{
            transform: !isLoading && value.trim() ? 'scale(1)' : 'scale(0.9)',
            transition: 'all var(--transition-base)'
          }}
        >
          {isLoading ? (
            <div className="spinner w-5 h-5" />
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 10H16M16 10L11 5M16 10L11 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            </svg>
          )}
        </button>
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
    </div>
  )
}
