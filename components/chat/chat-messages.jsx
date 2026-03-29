'use client'

import { useCallback, useEffect, useRef } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import useAutoRevert from '@/hooks/useAutoRevert'
import { cn } from '@/lib/utils'

import { Bot, Check, Copy, User } from 'lucide-react'

function CopyButton({ text }) {
  const [copied, setCopied] = useAutoRevert(false, 2000)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
  }, [text, setCopied])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

export function UserMessage({ text, userImage, userName }) {
  return (
    <div className="group flex gap-3 justify-end">
      <div className="flex flex-col items-end gap-1 max-w-[80%]">
        <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        </div>
      </div>
      <Avatar className="h-8 w-8 shrink-0">
        {userImage ? (
          <AvatarImage src={userImage} alt={userName || 'User'} />
        ) : null}
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

export function BotMessage({ text, children }) {
  return (
    <div className="group flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 bg-primary/10">
        <AvatarFallback>
          <Bot className="h-4 w-4 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1 max-w-[80%]">
        {text ? (
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap m-0">{text}</p>
            </div>
            <div className="flex justify-end mt-1">
              <CopyButton text={text} />
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 bg-primary/10">
        <AvatarFallback>
          <Bot className="h-4 w-4 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

export function ChatMessageList({
  messages,
  message,
  thinking,
  userImage,
  userName,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, message, thinking])

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages
        .filter(({ type }) => ['user', 'bot'].includes(type))
        .map(({ id, type, text, children }) => {
          switch (type) {
            case 'user':
              return (
                <UserMessage
                  key={id}
                  text={text}
                  userImage={userImage}
                  userName={userName}
                />
              )
            case 'bot':
              return (
                <BotMessage key={id} text={text}>
                  {children}
                </BotMessage>
              )
            default:
              return null
          }
        })}
      {message ? <BotMessage key="streaming" text={message.text} /> : null}
      {thinking ? <ThinkingIndicator /> : null}
      <div ref={bottomRef} />
    </div>
  )
}
