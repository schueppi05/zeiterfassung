import type { HttpRequest } from '@azure/functions'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

/**
 * Prüft das Entra-ID-Zugriffstoken (Bearer) und die Gruppenzugehörigkeit.
 * Nur Mitglieder der Gruppe ENTRA_ALLOWED_GROUP_ID (Mitarbeitende Pfäffikon) dürfen die API nutzen.
 * Hinweis: Die Gruppen-ID muss als "groups"-Claim im Token enthalten sein
 * (App-Registrierung: Token-Konfiguration → Gruppenanspruch hinzufügen).
 */
export interface AuthUser {
  oid: string
  name: string
  email: string
  claims: JWTPayload
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Umgebungsvariable ${name} fehlt`)
  return v
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined

export async function authenticate(req: HttpRequest): Promise<AuthUser> {
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw new HttpError(401, 'Anmeldung erforderlich')

  const tenant = env('ENTRA_TENANT_ID')
  const audience = env('ENTRA_API_CLIENT_ID')
  jwks ??= createRemoteJWKSet(
    new URL(`https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`),
  )

  let payload: JWTPayload
  try {
    ;({ payload } = await jwtVerify(token, jwks, {
      issuer: `https://login.microsoftonline.com/${tenant}/v2.0`,
      audience,
    }))
  } catch {
    throw new HttpError(401, 'Ungültiges Token')
  }

  const groups = (payload.groups as string[] | undefined) ?? []
  if (!groups.includes(env('ENTRA_ALLOWED_GROUP_ID'))) {
    throw new HttpError(403, 'Kein Zugriff')
  }

  return {
    oid: String(payload.oid),
    name: String(payload.name ?? ''),
    email: String(payload.preferred_username ?? payload.email ?? ''),
    claims: payload,
  }
}
