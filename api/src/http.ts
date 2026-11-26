import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { authenticate, HttpError } from './auth'
import { db } from './db'

export type Rolle = 'mitarbeiter' | 'vorgesetzter' | 'admin'

export interface AppUser {
  id: string
  name: string
  email: string
  rolle: Rolle
  pensum: number
  ferienanspruchTage: number
}

interface RouteOptions {
  /** Erlaubte Rollen; ohne Angabe sind alle angemeldeten Benutzer zugelassen. */
  rollen?: Rolle[]
  /** HTTP-Statuscode bei Erfolg (Standard 200). */
  status?: number
}

/** Kapselt Authentifizierung, Benutzeranlage, Rollenprüfung und Fehlerbehandlung. */
export function protectedRoute(
  handler: (req: HttpRequest, user: AppUser) => Promise<unknown>,
  opts: RouteOptions = {},
) {
  return async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auth = await authenticate(req)
      const { rows } = await db().query(
        `insert into benutzer (entra_id, name, email)
         values ($1, $2, $3)
         on conflict (entra_id) do update set name = excluded.name, email = excluded.email
         returning id, name, email, rolle, pensum, ferienanspruch_tage::float as "ferienanspruchTage"`,
        [auth.oid, auth.name, auth.email],
      )
      const user = rows[0] as AppUser
      if (opts.rollen && !opts.rollen.includes(user.rolle)) throw new HttpError(403, 'Keine Berechtigung')
      const body = await handler(req, user)
      return body === undefined
        ? { status: 204 }
        : { status: opts.status ?? 200, jsonBody: body }
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, jsonBody: { fehler: e.message } }
      ctx.error(e)
      return { status: 500, jsonBody: { fehler: 'Interner Fehler' } }
    }
  }
}

// --- Validierung -------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseUuid(v: unknown, feld = 'id'): string {
  if (typeof v !== 'string' || !UUID.test(v)) throw new HttpError(400, `${feld} ungültig`)
  return v
}

export function parseDatum(v: unknown, feld = 'datum'): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, `${feld} ungültig`)
  const d = new Date(v + 'T00:00:00Z')
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
    throw new HttpError(400, `${feld} ungültig`)
  }
  return v
}

export async function jsonBody(req: HttpRequest): Promise<Record<string, unknown>> {
  try {
    const b = await req.json()
    if (b && typeof b === 'object' && !Array.isArray(b)) return b as Record<string, unknown>
  } catch {
    /* fällt durch */
  }
  throw new HttpError(400, 'Ungültiger Request-Body')
}

export function text(v: unknown, feld: string, max = 500): string {
  if (v === undefined || v === null) return ''
  if (typeof v !== 'string' || v.length > max) throw new HttpError(400, `${feld} ungültig`)
  return v.trim()
}
