import { app } from '@azure/functions'
import { protectedRoute } from '../http'

/** Liefert den angemeldeten Benutzer (wird beim ersten Login automatisch angelegt). */
app.http('me', {
  route: 'me',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: protectedRoute(async (_req, user) => user),
})
