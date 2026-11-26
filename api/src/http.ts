import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { authenticate, HttpError, type AuthUser } from './auth'

/** Kapselt Authentifizierung und Fehlerbehandlung für alle geschützten Endpunkte. */
export function protectedRoute(
  handler: (req: HttpRequest, user: AuthUser) => Promise<unknown>,
) {
  return async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const user = await authenticate(req)
      return { status: 200, jsonBody: await handler(req, user) }
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, jsonBody: { fehler: e.message } }
      ctx.error(e)
      return { status: 500, jsonBody: { fehler: 'Interner Fehler' } }
    }
  }
}
