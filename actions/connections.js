'use server'

import { getBotId, getChatBotKitClient } from '@/lib/chatbotkit'
import { generateFingerprint } from '@/lib/contact'
import { requireSession } from '@/lib/session'

const cbk = getChatBotKitClient()

/**
 * Lists connections (personal secrets) required by the configured bot for the
 * current contact.
 *
 * Uses the `bots` GraphQL query filtered by bot ID to traverse
 * bot -> skillset -> abilities -> secret and returns each personal secret's
 * verification status for this contact.
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   description: string,
 *   status: 'authenticated' | 'unauthenticated',
 *   authUrl: string | null,
 * }>>}
 */
export async function listConnections() {
  const { session } = await requireSession()

  const botId = getBotId()

  // Ensure the contact exists
  const { id: contactId } = await cbk.contact.ensure({
    fingerprint: generateFingerprint(session.user.email),
    email: session.user.email,
    name: session.user.name || '',
  })

  // Discover all personal secrets required by this bot for this contact
  const { data } = await cbk.graphql.call({
    query: /* GraphQL */ `
      query availableSecrets($botId: ID!, $contactIds: [ID!]!) {
        bots(last: 1, botIds: [$botId]) {
          edges {
            node {
              skillset {
                abilities {
                  edges {
                    node {
                      secret {
                        id
                        name
                        description
                        kind
                        contacts(contactIds: $contactIds) {
                          verification {
                            status
                            action {
                              type
                              url
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    variables: { botId, contactIds: [contactId] },
  })

  const abilityEdges =
    data?.bots?.edges?.[0]?.node?.skillset?.abilities?.edges ?? []

  const edges = abilityEdges
    .map((edge) => edge?.node?.secret)
    .filter((secret) => secret?.id && secret?.kind === 'personal')

  return edges.map((secret) => {
    const verification = secret.contacts?.[0]?.verification

    return {
      id: secret.id,
      name: secret.name || secret.id,
      description: secret.description || '',
      status: verification?.status || 'unauthenticated',
      authUrl: verification?.action?.url || null,
    }
  })
}

/**
 * Revokes a connection (secret) for the current user.
 *
 * @param {string} secretId - The secret ID to revoke
 * @returns {Promise<{ status: string, authUrl: string | null }>}
 */
export async function revokeConnection(secretId) {
  const { session } = await requireSession()

  const { id: contactId } = await cbk.contact.ensure({
    fingerprint: generateFingerprint(session.user.email),
    email: session.user.email,
    name: session.user.name || '',
  })

  await cbk.contact.secret.revoke(contactId, secretId)

  const verification = await cbk.contact.secret.verify(contactId, secretId)

  return {
    status: verification.status || 'unauthenticated',
    authUrl: verification.action?.url || null,
  }
}
