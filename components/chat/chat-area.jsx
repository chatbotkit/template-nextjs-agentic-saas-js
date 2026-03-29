'use client'

import { useContext, useEffect, useRef } from 'react'

import { ScrollArea } from '@/components/ui/scroll-area'

import { ChatInputArea } from './chat-input'
import { ChatMessageList } from './chat-messages'

import { ConversationContext } from '@chatbotkit/react'

export default function ChatArea({
  userImage,
  userName,
  restoredMessages,
  onResponseComplete,
}) {
  const { thinking, text, setText, message, messages, submit } =
    useContext(ConversationContext)

  // Track thinking transitions to detect when a response finishes
  const wasThinking = useRef(false)

  useEffect(() => {
    if (wasThinking.current && !thinking) {
      onResponseComplete?.()
    }

    wasThinking.current = thinking
  }, [thinking, onResponseComplete])

  // Combine restored (historical) messages with live messages
  const allMessages = [...(restoredMessages || []), ...messages]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea className="flex-1">
        {allMessages.length === 0 && !thinking ? (
          <EmptyState />
        ) : (
          <div className="mx-auto max-w-3xl">
            <ChatMessageList
              messages={allMessages}
              message={message}
              thinking={thinking}
              userImage={userImage}
              userName={userName}
            />
          </div>
        )}
      </ScrollArea>
      <ChatInputArea
        text={text}
        setText={setText}
        submit={submit}
        thinking={thinking}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
        <svg
          className="w-8 h-8 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Start a conversation</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Type a message below to begin chatting with your AI assistant.
        </p>
      </div>
    </div>
  )
}
