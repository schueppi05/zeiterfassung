import { app } from '@azure/functions'
import { db } from '../db'
import { protectedRoute } from '../http'

/** Liefert den angemeldeten Benutzer; legt ihn beim ersten Login automatisch an. */
app.http('me', {
  route: 'me',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: protectedRoute(async (_req, user) => {
    const { rows } = await db().query(
      `insert into benutzer (entra_id, name, email)
       values ($1, $2, $3)
       on conflict (entra_id) do update set name = excluded.name, email = excluded.email
       returning id, name, email, rolle, pensum, ferienanspruch_tage`,
      [user.oid, user.name, user.email],
    )
    return rows[0]
  }),
})
