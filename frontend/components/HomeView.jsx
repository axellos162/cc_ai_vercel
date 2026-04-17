'use client'

import QueryInput from './QueryInput'
import UserMenu from './auth/UserMenu'
import ViewToggle from './ViewToggle'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const SUGGESTION_CHIPS = [
  "Acne Studios jeans in New York",
  "Stores in Austin carrying Agolde",
  "Show me dresses under $300 in LA",
  "Which is cheaper, Toteme or Agolde?",
  "Does any SF store carry Jacquemus?"
]

export default function HomeView({ onSubmit, isLoading, onOpenAuth, onOpenProfile, onOpenHistory, onOpenFavorites, onExplore }) {
  const { user } = useAuth()
  const [inputValue, setInputValue] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true)
  }, [])

  const handleSubmit = (query) => {
    onSubmit(query)
    setInputValue("")
  }

  const handleChipClick = (chipText) => {
    onSubmit(chipText)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* View Toggle in top-left corner */}
      <div
        className="fixed top-8 left-8 z-20"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 600ms cubic-bezier(0.4, 0.0, 0.2, 1) 800ms'
        }}
      >
        <ViewToggle
          activeView="search"
          onViewChange={(view) => {
            if (view === 'map') {
              onExplore()
            }
          }}
        />
      </div>

      {/* User menu / Login button in top-right corner */}
      <div
        className="fixed top-8 right-8 z-20"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 600ms cubic-bezier(0.4, 0.0, 0.2, 1) 800ms'
        }}
      >
        {user ? (
          <UserMenu
            onOpenProfile={onOpenProfile}
            onOpenHistory={onOpenHistory}
            onOpenFavorites={onOpenFavorites}
          />
        ) : (
          <button
            onClick={onOpenAuth}
            className="auth-button"
          >
            SIGN IN
          </button>
        )}
      </div>

      {/* Decorative elements */}
      <div className="decorative-line decorative-line-1" />
      <div className="decorative-line decorative-line-2" />

      <div className="w-full flex flex-col items-center relative z-10">
        {/* App name with staggered animation */}
        <div className="overflow-hidden mb-3">
          <h1
            className="font-display text-text-primary"
            style={{
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 300,
              letterSpacing: '0.28em',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'opacity 800ms cubic-bezier(0.4, 0.0, 0.2, 1), transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            CONCEPT COMMERCE
          </h1>
        </div>

        {/* Decorative divider */}
        <div
          className="divider-line"
          style={{
            width: isVisible ? '240px' : '0px',
            transition: 'width 600ms cubic-bezier(0.4, 0.0, 0.2, 1) 200ms'
          }}
        />

        {/* Tagline */}
        <p
          className="font-body text-text-secondary mb-16 mt-6"
          style={{
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 600ms cubic-bezier(0.4, 0.0, 0.2, 1) 400ms, transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1) 400ms'
          }}
        >
          Search across stores · Find what matters
        </p>

        {/* Query Input */}
        <div
          className="w-full"
          style={{
            maxWidth: 'min(720px, 90vw)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 600ms cubic-bezier(0.4, 0.0, 0.2, 1) 600ms, transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1) 600ms'
          }}
        >
          <QueryInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            variant="centered"
          />

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {SUGGESTION_CHIPS.map((chip, index) => (
              <button
                key={index}
                onClick={() => handleChipClick(chip)}
                disabled={isLoading}
                className="chip"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'scale(1)' : 'scale(0.9)',
                  transition: `opacity 400ms cubic-bezier(0.4, 0.0, 0.2, 1) ${800 + index * 80}ms, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${800 + index * 80}ms`
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <style jsx>{`
          .auth-button {
            background: transparent;
            border: 1px solid var(--color-border-default);
            padding: 10px 24px;
            font-family: var(--font-body);
            font-size: 11px;
            font-weight: 400;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--color-text-secondary);
            cursor: pointer;
            transition: all var(--transition-base);
          }
          .auth-button:hover {
            border-color: var(--color-text-accent);
            color: var(--color-text-accent);
            transform: translateY(-1px);
          }

          .decorative-line {
            position: absolute;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--color-border-subtle), transparent);
          }
          .decorative-line-1 {
            top: 20%;
            left: -10%;
            right: -10%;
            opacity: ${isVisible ? 0.5 : 0};
            transition: opacity 800ms cubic-bezier(0.4, 0.0, 0.2, 1) 300ms;
          }
          .decorative-line-2 {
            bottom: 20%;
            left: -10%;
            right: -10%;
            opacity: ${isVisible ? 0.3 : 0};
            transition: opacity 800ms cubic-bezier(0.4, 0.0, 0.2, 1) 500ms;
          }

          .divider-line {
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--color-text-accent), transparent);
            opacity: 0.3;
          }

          .chip {
            background: var(--color-bg-accent);
            border: 1px solid var(--color-border-default);
            border-radius: 0;
            padding: 8px 16px;
            font-family: var(--font-body);
            font-size: 11px;
            font-weight: 400;
            letter-spacing: 0.05em;
            color: var(--color-text-secondary);
            cursor: pointer;
            transition: all var(--transition-base);
            position: relative;
            overflow: hidden;
          }
          .chip::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(201, 185, 154, 0.1), transparent);
            transition: left 400ms cubic-bezier(0.4, 0.0, 0.2, 1);
          }
          .chip:hover:not(:disabled)::before {
            left: 100%;
          }
          .chip:hover:not(:disabled) {
            border-color: var(--color-border-accent);
            color: var(--color-text-accent);
            transform: translateY(-1px);
          }
          .chip:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  )
}
