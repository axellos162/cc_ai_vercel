'use client'

/**
 * Navigation component for switching between Search and Explore views
 * Minimal tab design matching the SSENSE-inspired aesthetic
 */
export default function Navigation({ currentView, onViewChange }) {
  const tabs = [
    { id: 'search', label: 'Search' },
    { id: 'explore', label: 'Explore' }
  ]

  // Determine which view to show for 'search' tab (home or chat)
  const isSearchActive = currentView === 'home' || currentView === 'home-fading' || currentView === 'chat-fading' || currentView === 'chat'
  const isExploreActive = currentView === 'explore'

  const handleTabClick = (tabId) => {
    if (tabId === 'search' && !isSearchActive) {
      onViewChange('home')
    } else if (tabId === 'explore' && !isExploreActive) {
      onViewChange('explore')
    }
  }

  return (
    <nav
      className="border-b border-border-subtle"
      style={{
        background: 'var(--color-bg-base)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div
        className="flex items-center gap-1"
        style={{
          paddingLeft: 'var(--space-page-x)',
          paddingTop: '24px'
        }}
      >
        {tabs.map(tab => {
          const isActive = tab.id === 'search' ? isSearchActive : isExploreActive

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="tab-button font-body"
              data-active={isActive}
              style={{
                fontSize: '13px',
                fontWeight: 400,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '12px 32px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid transparent',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                position: 'relative'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <style jsx>{`
        .tab-button:hover {
          color: var(--color-text-primary);
        }

        .tab-button[data-active="true"] {
          border-bottom-color: var(--color-text-accent);
        }

        .tab-button[data-active="true"]::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-text-accent);
        }
      `}</style>
    </nav>
  )
}
