'use server'

import { getBotId, getChatBotKitClient } from '@/lib/chatbotkit'
import { generateFingerprint } from '@/lib/contact'
import { requireSession } from '@/lib/session'

import { streamComplete } from '@chatbotkit/react/actions/complete'

const cbk = getChatBotKitClient()

/**
 * Ensures a ChatBotKit contact exists for the authenticated user.
 *
 * Generates a deterministic UUID v5 fingerprint from the user's email so the
 * fingerprint is stable and doesn't leak raw PII.
 *
 * @returns {Promise<string>} The contact ID
 */
export async function ensureContact() {
  const { session } = await requireSession()

  const { id } = await cbk.contact.ensure({
    fingerprint: generateFingerprint(session.user.email),
    email: session.user.email,
    name: session.user.name || '',
  })

  return id
}

/**
 * Returns the configured bot details.
 */
export async function getAgent() {
  await requireSession()

  const botId = getBotId()
  const bot = await cbk.bot.fetch(botId)

  return {
    id: bot.id,
    name: bot.name || 'AI Agent',
    description: bot.description || '',
  }
}

/**
 * Lists conversations for a contact, ordered by most recent first.
 *
 * @param {string} contactId - The contact ID to list conversations for
 */
export async function listConversations(contactId) {
  await requireSession()

  const { items } = await cbk.contact.conversation.list(contactId, {
    order: 'desc',
    take: 50,
  })

  return items.map(({ id, name, description, createdAt }) => ({
    id,
    name: name || '',
    description: description || '',
    createdAt,
  }))
}

/**
 * Deletes a conversation from the platform.
 *
 * @param {string} conversationId - The conversation ID to delete
 */
export async function deleteConversation(conversationId) {
  await requireSession()

  await cbk.conversation.delete(conversationId)
}

/**
 * Fetches the messages of an existing conversation.
 *
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Array<{ id: string, type: string, text: string, createdAt: string }>>}
 */
export async function fetchConversationMessages(conversationId) {
  await requireSession()

  const { items } = await cbk.conversation.message.list(conversationId)

  return items
    .filter(({ type }) => type === 'user' || type === 'bot')
    .map(({ id, type, text, createdAt }) => ({
      id,
      type,
      text,
      createdAt: new Date(createdAt).toISOString(),
    }))
}

/**
 * Generates a short name and description for a conversation based on its
 * messages, used as labels in the conversation history sidebar.
 *
 * @param {Array<{ type: string, text: string }>} messages
 * @returns {Promise<{ name: string, description: string }>}
 */
async function generateConversationLabel(messages) {
  const userMessages = messages
    .filter((m) => m.type === 'user')
    .map((m) => m.text)
    .slice(0, 3)
    .join(' ')

  const name = userMessages.slice(0, 80) || 'New conversation'
  const description = userMessages.slice(0, 200) || ''

  return { name, description }
}

/**
 * Completes a conversation turn using ChatBotKit streaming.
 *
 * Uses the single configured bot (CHATBOTKIT_BOT_ID) for all conversations.
 *
 * @param {object} params
 * @param {string} [params.contactId] - The contact ID to associate with
 * @param {string} [params.conversationId] - Resume an existing conversation
 * @param {Array} params.messages - The conversation messages
 */
export async function complete({ contactId, conversationId, messages }) {
  await requireSession()

  const botId = getBotId()

  return streamComplete({
    client: cbk.conversation,

    botId,

    ...(contactId ? { contactId } : {}),

    messages,

    /**
     * Called when the streaming begins. Creates a new conversation if one
     * doesn't exist yet.
     */
    async onStart() {
      if (!contactId) {
        return
      }

      if (!conversationId) {
        const conversation = await cbk.conversation.create({
          contactId,
          botId,
        })

        conversationId = conversation.id
      }

      return {
        type: 'conversation',
        data: { id: conversationId },
      }
    },

    /**
     * Called when the streaming completes. Persists the new messages
     * to the conversation and updates the label.
     */
    async onFinish({ messages: allMessages }) {
      if (!conversationId) {
        return
      }

      const newMessages = allMessages.slice(messages.length - 1)

      if (newMessages.length === 0) {
        return
      }

      for (const msg of newMessages) {
        await cbk.conversation.message.create(conversationId, {
          type: msg.type,
          text: msg.text,
        })
      }

      const { name, description } = await generateConversationLabel(allMessages)

      await cbk.conversation.update(conversationId, { name, description })

      return {
        type: 'conversation',
        data: { id: conversationId, name, description },
      }
    },
  })
}
