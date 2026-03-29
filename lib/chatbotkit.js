import 'server-only'

import { ChatBotKit } from '@chatbotkit/sdk'

let client = null

export function getChatBotKitClient() {
  if (!process.env.CHATBOTKIT_API_SECRET) {
    throw new Error('Missing CHATBOTKIT_API_SECRET')
  }

  if (!client) {
    client = new ChatBotKit({
      secret: process.env.CHATBOTKIT_API_SECRET,
    })
  }

  return client
}

export function getBotId() {
  const botId = process.env.CHATBOTKIT_BOT_ID

  if (!botId) {
    throw new Error(
      'Missing CHATBOTKIT_BOT_ID. Set it to the bot ID that powers your agent.'
    )
  }

  return botId
}
