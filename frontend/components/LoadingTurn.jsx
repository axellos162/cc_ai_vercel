export default function LoadingTurn({ query }) {
  return (
    <div>
      {/* Query line */}
      <div className="flex items-start gap-2 mb-4">
        <span className="text-text-tertiary text-sm">→</span>
        <p className="font-body text-sm text-text-secondary">{query}</p>
      </div>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-4">
        <div className="dot" style={{ animationDelay: '0ms' }} />
        <div className="dot" style={{ animationDelay: '200ms' }} />
        <div className="dot" style={{ animationDelay: '400ms' }} />
      </div>

      <style jsx>{`
        .dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--color-text-tertiary);
          animation: pulse 1.2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% {
            background: var(--color-text-tertiary);
          }
          50% {
            background: var(--color-text-accent);
          }
        }
      `}</style>
    </div>
  )
}
