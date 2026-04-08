'use client'

import { useCallback, useEffect, useState } from 'react'

import { revokeConnection } from '@/actions/connections'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { CheckCircle2, ExternalLink, Link2Off, XCircle } from 'lucide-react'

/**
 * Displays the list of available connections and their authentication status.
 * Allows customers to authenticate or revoke connections.
 */
export default function ConnectionList({ connections: initialConnections }) {
  const [connections, setConnections] = useState(initialConnections || [])
  const [revokingId, setRevokingId] = useState(null)
  const [confirmRevokeId, setConfirmRevokeId] = useState(null)
  const [error, setError] = useState(null)

  // Listen for OAuth callback messages from popup windows
  useEffect(() => {
    function handleMessage(event) {
      const secretId = event.data?.params?.secretId

      if (event.data?.type === 'oauth' && secretId) {
        setConnections((prev) =>
          prev.map((conn) =>
            conn.id === secretId
              ? { ...conn, status: 'authenticated', authUrl: null }
              : conn
          )
        )
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleAuthenticate = useCallback((authUrl) => {
    if (authUrl) {
      window.open(authUrl, '_blank', 'width=600,height=700')
    }
  }, [])

  const handleRevoke = useCallback(async () => {
    const secretId = confirmRevokeId
    setConfirmRevokeId(null)
    setRevokingId(secretId)

    try {
      const result = await revokeConnection(secretId)

      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === secretId
            ? { ...conn, status: result.status, authUrl: result.authUrl }
            : conn
        )
      )
    } catch (err) {
      console.error('[ConnectionList] Failed to revoke:', err)
      setError(`Failed to revoke connection: ${err.message || 'Unknown error'}`)
    } finally {
      setRevokingId(null)
    }
  }, [confirmRevokeId])

  const authenticatedCount = connections.filter(
    (c) => c.status === 'authenticated'
  ).length
  const totalCount = connections.length

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2Off className="h-5 w-5" />
            Connections
          </CardTitle>
          <CardDescription>
            {totalCount === 0
              ? 'No connections required. Your agent is ready to use.'
              : `${authenticatedCount} of ${totalCount} connections active. Connect your services to enable your agent.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          ) : null}
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-sm">
                Your agent is fully configured and ready to use.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border',
                    connection.status === 'authenticated'
                      ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                      : 'bg-muted/30 border-dashed'
                  )}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border">
                    {connection.status === 'authenticated' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {connection.name}
                    </p>
                    {connection.description ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {connection.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    {connection.status === 'authenticated' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={revokingId === connection.id}
                        onClick={() => setConfirmRevokeId(connection.id)}
                      >
                        {revokingId === connection.id
                          ? 'Revoking...'
                          : 'Revoke'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleAuthenticate(connection.authUrl)}
                        disabled={!connection.authUrl}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmRevokeId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRevokeId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect this service from your agent. You can
              reconnect it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
