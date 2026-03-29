'use client'

import { useCallback, useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { ArrowUp, Square } from 'lucide-react'

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Type a message...',
}) {
  const textareaRef = useRef(null)

  // Refocus the textarea when the bot finishes responding
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [disabled])

  const handleSubmit = useCallback(() => {
    onSubmit()

    // Refocus after submit on next tick
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }, [onSubmit])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (value.trim() && !disabled) {
          handleSubmit()
        }
      }
    },
    [value, handleSubmit, disabled]
  )

  const handleInput = useCallback(
    (e) => {
      const textarea = e.target
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
      onChange(e.target.value)
    },
    [onChange]
  )

  return (
    <div className="relative flex items-end gap-2 border rounded-2xl bg-background p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent px-3 py-2 text-sm',
          'placeholder:text-muted-foreground',
          'focus:outline-none',
          'disabled:opacity-50',
          'max-h-[200px]'
        )}
      />
      <Button
        type="button"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-xl"
        disabled={!value.trim() || disabled}
        onClick={handleSubmit}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ChatInputArea({ text, setText, submit, thinking }) {
  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <ChatInput
          value={text}
          onChange={setText}
          onSubmit={submit}
          disabled={thinking}
          placeholder={
            thinking ? 'Waiting for response...' : 'Type a message...'
          }
        />
        <p className="text-center text-xs text-muted-foreground mt-2">
          AI responses may not always be accurate. Please verify important
          information.
        </p>
      </div>
    </div>
  )
}
