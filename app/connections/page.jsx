import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { listConnections } from '@/actions/connections'
import { getAgent } from '@/actions/conversation'
import ChatHeader from '@/components/chat/chat-header'
import ConnectionList from '@/components/connections/connection-list'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import authOptions from '@/lib/auth-options'
import { getBillingStatusForUser } from '@/lib/billing'

import { CheckCircle2, MessageSquare } from 'lucide-react'

export default async function ConnectionsPage() {
  const session = await getServerSession(authOptions)
  const billing = await getBillingStatusForUser(session?.user)

  if (!billing.hasAccess) {
    redirect('/billing')
  }

  let agent = null
  let connections = []
  let error = null

  try {
    ;[agent, connections] = await Promise.all([getAgent(), listConnections()])
  } catch (err) {
    error = err.message || 'Failed to load agent configuration'
  }

  const allConnected =
    connections.length === 0 ||
    connections.every((c) => c.status === 'authenticated')

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader agentName={agent?.name} />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-muted/20">
        <div className="max-w-3xl mx-auto space-y-6">
          {error ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">
                  Configuration Error
                </CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  Make sure <code>CHATBOTKIT_API_SECRET</code> and{' '}
                  <code>CHATBOTKIT_BOT_ID</code> are set in your environment
                  variables.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {allConnected ? (
                <Card className="border-green-200 dark:border-green-900">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div>
                        <CardTitle>Agent Ready</CardTitle>
                        <CardDescription>
                          {agent?.name || 'Your AI agent'} is fully configured
                          and running. Chat with it or manage your connections
                          below.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="gap-2">
                      <Link href="/chat">
                        <MessageSquare className="h-4 w-4" />
                        Chat with Agent
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Setup Required</CardTitle>
                    <CardDescription>
                      Connect the services below to activate your AI agent. Once
                      all connections are established, your agent will start
                      working automatically.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              <ConnectionList connections={connections} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
