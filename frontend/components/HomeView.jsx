'use client'

import QueryInput from './QueryInput'
import { useState } from 'react'

const SUGGESTION_CHIPS = [
  "Acne Studios jeans in New York",
  "Stores in Austin carrying Agolde",
  "Show me dresses under $300 in LA",
  "Which is cheaper, Toteme or Agolde?",
  "Does any SF store carry Jacquemus?"
]

export default function HomeView({ onSubmit, isLoading }) {
  const [inputValue, setInputValue] = useState("")

  const handleSubmit = (query) => {
    onSubmit(query)
    setInputValue("")
  }

  const handleChipClick = (chipText) => {
    onSubmit(chipText)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full flex flex-col items-center">
        {/* App name */}
        <h1 
          className="font-display text-text-primary mb-2"
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 300,
            letterSpacing: '0.25em'
          }}
        >
          CONCEPT COMMERCE
        </h1>

        {/* Tagline */}
        <p 
          className="font-body text-text-secondary mb-12"
          style={{
            fontSize: '14px',
            fontWeight: 300,
            letterSpacing: '0.05em'
          }}
        >
          Search across stores. Find what matters.
        </p>

        {/* Query Input */}
        <div className="w-full" style={{ maxWidth: 'min(640px, 90vw)' }}>
          <QueryInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            variant="centered"
          />

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {SUGGESTION_CHIPS.map((chip, index) => (
              <button
                key={index}
                onClick={() => handleChipClick(chip)}
                disabled={isLoading}
                className="chip"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <style jsx>{`
          .chip {
            background: transparent;
            border: 1px solid var(--color-border-default);
            border-radius: 2px;
            padding: 6px 12px;
            font-family: var(--font-body);
            font-size: 12px;
            font-weight: 400;
            color: var(--color-text-secondary);
            cursor: pointer;
            transition: border-color var(--transition-base), color var(--transition-base);
          }
          .chip:hover:not(:disabled) {
            border-color: var(--color-border-strong);
            color: var(--color-text-primary);
          }
          .chip:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  )
}
