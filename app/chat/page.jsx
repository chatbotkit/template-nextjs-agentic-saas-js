import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { complete, getAgent } from '@/actions/conversation'
import authOptions from '@/lib/auth-options'
import { getBillingStatusForUser } from '@/lib/billing'

import ChatPage from './chat-page'

export default async function Page() {
  const session = await getServerSession(authOptions)
  const billing = await getBillingStatusForUser(session?.user)

  if (!billing.hasAccess) {
    redirect('/billing')
  }

  let agentName = 'AI Agent'

  try {
    const agent = await getAgent()
    agentName = agent.name
  } catch {
    // Fall back to default name
  }

  return (
    <ChatPage
      endpoint={complete}
      userImage={session?.user?.image}
      userName={session?.user?.name}
      agentName={agentName}
    />
  )
}
