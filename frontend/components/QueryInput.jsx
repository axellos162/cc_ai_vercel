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
          background: '#1a1a1a',
          border: `1px solid ${isFocused ? '#444444' : '#2e2e2e'}`,
          borderRadius: '4px',
          boxShadow: isFocused ? '0 0 0 1px rgba(201, 185, 154, 0.15)' : 'none',
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

  // Centered variant keeps original styling
  const baseClasses = "w-full h-14 flex items-center bg-bg-elevated transition-colors duration-200"
  const variantClasses = "border border-border-default rounded-sm"

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1 h-full px-4 bg-transparent text-base font-body text-text-primary placeholder:text-text-tertiary outline-none disabled:opacity-50"
        style={{
          transition: 'border-color var(--transition-base)'
        }}
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
