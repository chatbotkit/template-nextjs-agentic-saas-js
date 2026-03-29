'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useConversationContext } from '@/components/chat/conversation-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import {
  Bot,
  CreditCard,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  User,
} from 'lucide-react'

export default function ChatHeader({ agentName, onToggleSidebar }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const conversationCtx = useConversationContext()

  // Prefer the explicit prop; fall back to the shared context so the toggle
  // button is also visible on pages that don't pass onToggleSidebar directly.
  const toggleSidebar =
    onToggleSidebar ??
    (conversationCtx ? () => conversationCtx.setSidebarOpen((o) => !o) : null)

  return (
    <header className="flex items-center justify-between px-4 h-14 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        {toggleSidebar ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
            title="Toggle conversation history"
          >
            <Menu className="h-4 w-4" />
          </Button>
        ) : null}
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold hidden sm:inline">
            {agentName || 'AI Agent'}
          </h1>
        </div>
        <nav className="hidden sm:flex items-center gap-1 ml-2">
          <Button
            variant={pathname === '/chat' ? 'secondary' : 'ghost'}
            size="sm"
            asChild
            className={cn('gap-1.5 text-xs')}
          >
            <Link href="/chat">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </Link>
          </Button>
          <Button
            variant={pathname === '/connections' ? 'secondary' : 'ghost'}
            size="sm"
            asChild
            className={cn('gap-1.5 text-xs')}
          >
            <Link href="/connections">
              <Link2 className="h-3.5 w-3.5" />
              Connections
            </Link>
          </Button>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {session.user.image ? (
                    <AvatarImage
                      src={session.user.image}
                      alt={session.user.name || ''}
                    />
                  ) : null}
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session.user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="sm:hidden">
                <Link href="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Chat</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="sm:hidden">
                <Link href="/connections">
                  <Link2 className="mr-2 h-4 w-4" />
                  <span>Connections</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}
