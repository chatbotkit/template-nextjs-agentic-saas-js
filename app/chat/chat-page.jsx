'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import ChatArea from '@/components/chat/chat-area'
import ChatHeader from '@/components/chat/chat-header'
import { useConversationContext } from '@/components/chat/conversation-provider'

import ConversationManager from '@chatbotkit/react/components/ConversationManager'

export default function ChatPage({ endpoint, userImage, userName, agentName }) {
  const {
    contactId,
    activeConversationId,
    restoredMessages,
    setSidebarOpen,
    setSidebarRefreshKey,
  } = useConversationContext()

  // conversationKey resets ConversationManager whenever the active
  // conversation changes (including when it becomes null for a new conversation)
  const [conversationKey, setConversationKey] = useState(0)
  const prevConversationIdRef = useRef(activeConversationId)

  useEffect(() => {
    if (activeConversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = activeConversationId
      setConversationKey((k) => k + 1)
    }
  }, [activeConversationId])

  const handleComplete = useCallback(
    (params) => {
      const allMessages = [
        ...(restoredMessages || []),
        ...(params.messages || []),
      ]

      return endpoint({
        ...params,
        messages: allMessages,
        contactId,
        conversationId: activeConversationId,
      })
    },
    [endpoint, contactId, activeConversationId, restoredMessages]
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ChatHeader
        agentName={agentName}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />
      <ConversationManager key={conversationKey} endpoint={handleComplete}>
        <ChatArea
          userImage={userImage}
          userName={userName}
          restoredMessages={restoredMessages}
          onResponseComplete={() => setSidebarRefreshKey((k) => k + 1)}
        />
      </ConversationManager>
    </div>
  )
}
