'use client'

import { useState, useEffect } from 'react'
import HomeView from '@/components/HomeView'
import ChatView from '@/components/ChatView'
import ExploreView from '@/components/ExploreView'
import Navigation from '@/components/Navigation'
import AuthModal from '@/components/auth/AuthModal'
import ProfileModal from '@/components/auth/ProfileModal'
import SearchHistoryPanel from '@/components/auth/SearchHistoryPanel'
import FavoritesPanel from '@/components/auth/FavoritesPanel'
import { useAuth } from '@/contexts/AuthContext'

export default function Page() {
  const { user } = useAuth()
  const [turns, setTurns] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingQuery, setPendingQuery] = useState("")
  const [viewState, setViewState] = useState('home') // 'home' | 'home-fading' | 'chat-fading' | 'chat' | 'explore'

  // Auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false)

  // Handle view changes from navigation
  const handleViewChange = (newView) => {
    if (newView === 'explore') {
      setViewState('explore')
    } else if (newView === 'home') {
      // If coming from explore, go directly to home
      // If already in chat, trigger reset
      if (viewState === 'explore') {
        setViewState('home')
        setTurns([])
        setInputValue("")
        setPendingQuery("")
        setIsLoading(false)
      } else if (viewState === 'chat') {
        handleReset()
      }
    }
  }

  useEffect(() => {
    if (turns.length === 1 && viewState === 'home') {
      // First query submitted - trigger transition
      setViewState('home-fading')
      setTimeout(() => {
        setViewState('chat-fading')
        setTimeout(() => {
          setViewState('chat')
        }, 50)
      }, 200)
    }
  }, [turns.length, viewState])

  function handleReset() {
    // Trigger reverse transition: chat → home
    setViewState('chat-fading')
    setTimeout(() => {
      setViewState('home-fading')
      setTimeout(() => {
        setViewState('home')
      }, 50)
    }, 200)

    // Clear conversation data
    setTurns([]);
    setInputValue("");
    setPendingQuery("");
    setIsLoading(false);
  }

  async function handleSubmit(query) {
    if (!query.trim() || isLoading) return;
    setPendingQuery(query);
    setIsLoading(true);
    setInputValue(""); // Clear immediately for feedback
    try {
      // Build request body
      const requestBody = { query };

      // Add user_id if logged in
      if (user) {
        requestBody.user_id = user.id;
      }

      // Add context if previous turn exists
      if (turns.length > 0) {
        const previousTurn = turns[turns.length - 1];
        const previousResult = previousTurn.result;

        let previousProductIds = [];

        if (previousResult.ok && previousResult.results?.data) {
          const data = previousResult.results.data;

          // Extract product IDs based on result type
          if (data.products) {
            // product_grid
            previousProductIds = data.products.slice(0, 5).map(p => p.id);
          } else if (data.product_grid?.products) {
            // dual
            previousProductIds = data.product_grid.products.slice(0, 5).map(p => p.id);
          } else if (data.brand_a?.products) {
            // comparison - combine both brands
            previousProductIds = [
              ...data.brand_a.products.slice(0, 3).map(p => p.id),
              ...data.brand_b.products.slice(0, 2).map(p => p.id)
            ];
          }

          previousProductIds = previousProductIds.filter(id => id);
        }

        // Add context if we have product IDs
        if (previousProductIds.length > 0) {
          requestBody.context = {
            previous_product_ids: previousProductIds,
            previous_brand: previousResult.filters?.brand || null,
            previous_filters: previousResult.filters || null
          };
        }
      }

      const res = await fetch("/api/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setTurns(prev => [...prev, { query, result: data }]);
    } catch (err) {
      setTurns(prev => [...prev, {
        query,
        result: { ok: false, error: "Something went wrong. Please try again." }
      }]);
    } finally {
      setIsLoading(false);
      setPendingQuery("");
    }
  }

  return (
    <div>
      {/* Navigation - show when in chat or explore views */}
      {(viewState === 'chat' || viewState === 'explore') && (
        <Navigation
          currentView={viewState}
          onViewChange={handleViewChange}
        />
      )}

      {/* Home View */}
      {(viewState === 'home' || viewState === 'home-fading') && (
        <div
          className="transition-opacity duration-200"
          style={{ opacity: viewState === 'home-fading' ? 0 : 1 }}
        >
          <HomeView
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onOpenAuth={() => setShowAuthModal(true)}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenHistory={() => setShowHistoryPanel(true)}
            onOpenFavorites={() => setShowFavoritesPanel(true)}
            onExplore={() => setViewState('explore')}
          />
        </div>
      )}

      {/* Chat View */}
      {(viewState === 'chat-fading' || viewState === 'chat') && (
        <div
          className="transition-opacity duration-300"
          style={{ opacity: viewState === 'chat' ? 1 : 0 }}
        >
          <ChatView
            turns={turns}
            onSubmit={handleSubmit}
            onReset={handleReset}
            isLoading={isLoading}
            inputValue={inputValue}
            setInputValue={setInputValue}
            pendingQuery={pendingQuery}
            onSearchBrands={handleSubmit}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenHistory={() => setShowHistoryPanel(true)}
            onOpenFavorites={() => setShowFavoritesPanel(true)}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        </div>
      )}

      {/* Explore View */}
      {viewState === 'explore' && (
        <ExploreView
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenHistory={() => setShowHistoryPanel(true)}
          onOpenFavorites={() => setShowFavoritesPanel(true)}
          onBackToSearch={() => setViewState('home')}
        />
      )}

      {/* Auth Modals and Panels */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <SearchHistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        onQuerySelect={(query) => handleSubmit(query)}
      />

      <FavoritesPanel
        isOpen={showFavoritesPanel}
        onClose={() => setShowFavoritesPanel(false)}
      />
    </div>
  )
}
