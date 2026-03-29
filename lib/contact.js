import 'server-only'

import crypto from 'node:crypto'

/**
 * @note Namespace for generating deterministic UUID v5 fingerprints from user
 * emails. This ensures the same email always produces the same fingerprint
 * without leaking PII.
 */
export const CONTACT_NAMESPACE = 'a8e1b2c3-d4f5-6789-0abc-def123456789'

/**
 * Generates a deterministic UUID v5 from an email address and namespace.
 *
 * @param {string} email - The email to derive a fingerprint from
 * @returns {string} A deterministic UUID v5 string
 */
export function generateFingerprint(email) {
  const namespaceBytes = Buffer.from(CONTACT_NAMESPACE.replace(/-/g, ''), 'hex')

  const hash = crypto
    .createHash('sha1')
    .update(namespaceBytes)
    .update(email.toLowerCase())
    .digest()

  // Set version to 5 (SHA-1 based)
  hash[6] = (hash[6] & 0x0f) | 0x50

  // Set variant to RFC 4122
  hash[8] = (hash[8] & 0x3f) | 0x80

  const hex = hash.toString('hex').slice(0, 32)

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}
