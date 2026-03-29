'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  ensureContact,
  fetchConversationMessages,
} from '@/actions/conversation'

import ConversationSidebar from './conversation-sidebar'

const ConversationContext = createContext(null)

/**
 * Returns the shared conversation context. Returns null when rendered outside
 * of a ConversationProvider.
 */
export function useConversationContext() {
  return useContext(ConversationContext)
}

/**
 * Provides shared conversation state (active conversation, sidebar open/close)
 * across all pages so that navigating between Chat and Connections preserves
 * the selected conversation and sidebar visibility.
 *
 * Also renders the ConversationSidebar so it remains mounted regardless of
 * which tab is active.
 */
export default function ConversationProvider({ children }) {
  const [contactId, setContactId] = useState(null)
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [restoredMessages, setRestoredMessages] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0)

  useEffect(() => {
    ensureContact()
      .then(setContactId)
      .catch((err) => {
        console.error('[ConversationProvider] Failed to ensure contact:', err)
      })
  }, [])

  const handleSelectConversation = useCallback(async (conversationId) => {
    try {
      const messages = await fetchConversationMessages(conversationId)

      setActiveConversationId(conversationId)
      setRestoredMessages(messages)
    } catch (err) {
      console.error('[ConversationProvider] Failed to load conversation:', err)
    }
  }, [])

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null)
    setRestoredMessages(null)
  }, [])

  const handleDeleteConversation = useCallback(
    (conversationId) => {
      if (conversationId === activeConversationId) {
        setActiveConversationId(null)
        setRestoredMessages(null)
      }
    },
    [activeConversationId]
  )

  return (
    <ConversationContext.Provider
      value={{
        contactId,
        activeConversationId,
        restoredMessages,
        sidebarOpen,
        setSidebarOpen,
        sidebarRefreshKey,
        setSidebarRefreshKey,
        onSelectConversation: handleSelectConversation,
        onNewConversation: handleNewConversation,
        onDeleteConversation: handleDeleteConversation,
      }}
    >
      <ConversationSidebar
        contactId={contactId}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        refreshKey={sidebarRefreshKey}
      />
      {children}
    </ConversationContext.Provider>
  )
}
