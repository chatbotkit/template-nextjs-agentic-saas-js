'use client'

import { useEffect, useState } from 'react'

import { deleteConversation, listConversations } from '@/actions/conversation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import { MessageSquare, Plus, Trash2, X } from 'lucide-react'

/**
 * Sidebar that displays the user's conversation history and allows
 * switching between conversations or starting a new one.
 */
export default function ConversationSidebar({
  contactId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  open,
  onClose,
  refreshKey,
}) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    if (!contactId) {
      return
    }

    setLoading(true)

    listConversations(contactId)
      .then(setConversations)
      .catch((err) => {
        console.error(
          '[ConversationSidebar] Failed to load conversations:',
          err
        )
        setConversations([])
      })
      .finally(() => setLoading(false))
  }, [contactId, refreshKey])

  function handleDeleteClick(e, conversationId) {
    e.stopPropagation()
    setConfirmDeleteId(conversationId)
  }

  async function handleConfirmDelete() {
    const conversationId = confirmDeleteId

    setConfirmDeleteId(null)
    setDeletingId(conversationId)

    try {
      await deleteConversation(conversationId)

      setConversations((prev) => prev.filter((c) => c.id !== conversationId))

      if (onDeleteConversation) {
        onDeleteConversation(conversationId)
      }
    } catch (err) {
      console.error('[ConversationSidebar] Failed to delete:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {open ? (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} />
      ) : null}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed z-40 top-0 left-0 h-full w-72',
          'bg-background border-r flex flex-col',
          'transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 h-14 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-semibold">History</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                onNewConversation()
                onClose()
              }}
              title="New conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-xs text-muted-foreground">
                  Loading...
                </span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground">
                  No conversations yet
                </span>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    'group relative w-full text-left px-3 py-2.5 rounded-lg text-sm',
                    'hover:bg-accent transition-colors cursor-pointer',
                    'flex items-center gap-2 overflow-hidden',
                    conversation.id === activeConversationId
                      ? 'bg-accent'
                      : 'bg-transparent'
                  )}
                  onClick={() => {
                    onSelectConversation(conversation.id)
                    onClose()
                  }}
                >
                  <div className="flex-1 min-w-0 overflow-hidden flex flex-col gap-0.5">
                    <span className="block font-medium truncate">
                      {conversation.name || 'New conversation'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(conversation.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                    disabled={deletingId === conversation.id}
                    className={cn(
                      'shrink-0 p-1 rounded',
                      'opacity-60 sm:opacity-0 sm:group-hover:opacity-100',
                      'hover:bg-destructive/10 hover:text-destructive',
                      'transition-opacity',
                      deletingId === conversation.id &&
                        'opacity-100 animate-pulse'
                    )}
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its
              messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Formats a timestamp into a human-readable relative time string.
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString()
}
