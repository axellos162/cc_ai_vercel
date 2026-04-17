'use client'

import { useState } from 'react'

/**
 * Editorial-style view toggle component
 * Inspired by luxury fashion magazine section navigation
 *
 * @param {string} activeView - 'search' or 'map'
 * @param {function} onViewChange - Callback when view changes
 */
export default function ViewToggle({ activeView = 'search', onViewChange }) {
  const [hoveredView, setHoveredView] = useState(null)

  const options = [
    { id: 'search', label: 'AI SEARCH', number: '01' },
    { id: 'map', label: 'Store Map', number: '02' }
  ]

  return (
    <div className="view-toggle-container">
      {/* Edition label */}
      <div className="edition-label">
        View
      </div>

      {/* Toggle options */}
      <div className="toggle-options">
        {options.map((option, index) => {
          const isActive = activeView === option.id
          const isHovered = hoveredView === option.id

          return (
            <button
              key={option.id}
              onClick={() => onViewChange(option.id)}
              onMouseEnter={() => setHoveredView(option.id)}
              onMouseLeave={() => setHoveredView(null)}
              className="toggle-option"
              data-active={isActive}
            >
              {/* Edition number */}
              <span className="option-number">
                {option.number}
              </span>

              {/* Option label */}
              <span className="option-label">
                {option.label}
              </span>

              {/* Active indicator line */}
              {isActive && (
                <span className="active-line" />
              )}
            </button>
          )
        })}
      </div>

      <style jsx>{`
        .view-toggle-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          user-select: none;
        }

        .edition-label {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-text-tertiary);
          padding-left: 2px;
        }

        .toggle-options {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }

        .toggle-option {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: baseline;
          gap: 12px;
          position: relative;
          transition: all var(--transition-base);
        }

        .option-number {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.05em;
          color: var(--color-border-strong);
          transition: all var(--transition-base);
          min-width: 18px;
        }

        .option-label {
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-text-tertiary);
          transition: all var(--transition-slow);
          position: relative;
        }

        /* Active state */
        .toggle-option[data-active="true"] .option-number {
          color: var(--color-text-accent);
        }

        .toggle-option[data-active="true"] .option-label {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--color-text-primary);
          text-transform: none;
        }

        /* Active indicator line */
        .active-line {
          position: absolute;
          left: -16px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 20px;
          background: var(--color-text-accent);
          transition: all var(--transition-slow);
          animation: slideIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideIn {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            height: 20px;
            opacity: 1;
          }
        }

        /* Hover states */
        .toggle-option:not([data-active="true"]):hover .option-label {
          color: var(--color-text-secondary);
          letter-spacing: 0.1em;
        }

        .toggle-option:not([data-active="true"]):hover .option-number {
          color: var(--color-text-accent);
        }

        /* Subtle vertical divider between options */
        .toggle-options::before {
          content: '';
          position: absolute;
          left: -16px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(
            to bottom,
            transparent,
            var(--color-border-subtle) 20%,
            var(--color-border-subtle) 80%,
            transparent
          );
        }
      `}</style>
    </div>
  )
}
