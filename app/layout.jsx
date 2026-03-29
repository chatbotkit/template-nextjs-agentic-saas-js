import './globals.css'

import ConversationProvider from '@/components/chat/conversation-provider'
import Providers from '@/components/providers'
import { TooltipProvider } from '@/components/ui/tooltip'

export const metadata = {
  title: 'Agentic SaaS',
  description:
    'An AI-powered agent platform with authentication, billing, and integration management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <TooltipProvider>
            <ConversationProvider>{children}</ConversationProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  )
}
