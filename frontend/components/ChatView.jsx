'use client'

import QueryInput from './QueryInput'
import TurnBlock from './TurnBlock'
import LoadingTurn from './LoadingTurn'
import { useEffect, useRef } from 'react'

export default function ChatView({ turns, onSubmit, onReset, isLoading, inputValue, setInputValue, pendingQuery, onSearchBrands }) {
  const lastTurnRef = useRef(null)

  // Auto-scroll to the latest turn when turns change
  useEffect(() => {
    if (lastTurnRef.current) {
      lastTurnRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [turns, isLoading])

  return (
    <div className="relative min-h-screen">
      {/* History area */}
      <div
        style={{
          padding: 'var(--space-page-y) var(--space-page-x)',
          paddingBottom: '160px'
        }}
      >
        {turns.map((turn, index) => (
          <div
            key={index}
            ref={index === turns.length - 1 && !isLoading ? lastTurnRef : null}
          >
            <TurnBlock turn={turn} onSearchBrands={onSearchBrands} />
          </div>
        ))}
        
        {/* Loading turn */}
        {isLoading && pendingQuery && (
          <div ref={lastTurnRef}>
            <LoadingTurn query={pendingQuery} />
          </div>
        )}
      </div>

      {/* Fixed bottom input bar */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-border-subtle"
        style={{
          padding: '20px 64px 20px',
          background: '#111111',
          boxShadow: '0 -1px 0 #2e2e2e, 0 -24px 48px rgba(0,0,0,0.7)'
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Back button and app name label row */}
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: '6px' }}
          >
            {/* Back button */}
            <button
              onClick={onReset}
              className="font-body text-text-tertiary hover:text-text-secondary transition-colors"
              style={{
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color var(--transition-base)'
              }}
            >
              ← Home
            </button>

            {/* App name label */}
            <div
              className="font-body text-text-tertiary"
              style={{
                fontSize: '10px',
                letterSpacing: '0.15em'
              }}
            >
              CONCEPT COMMERCE
            </div>
          </div>

          {/* Query input */}
          <QueryInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={onSubmit}
            isLoading={isLoading}
            variant="bottom"
          />
        </div>
      </div>
    </div>
  )
}
