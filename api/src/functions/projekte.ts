import { app } from '@azure/functions'
import { db } from '../db'
import { HttpError } from '../auth'
import { jsonBody, protectedRoute, text } from '../http'

app.http('projekteListe', {
  route: 'projekte',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: protectedRoute(async () => {
    const { rows } = await db().query(
      `select id, code, name from projekt where aktiv order by code`,
    )
    return rows
  }),
})

app.http('projektAnlegen', {
  route: 'projekte',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: protectedRoute(
    async (req) => {
      const b = await jsonBody(req)
      const code = text(b.code, 'code', 30)
      const name = text(b.name, 'name', 120)
      if (!code || !name) throw new HttpError(400, 'Code und Name sind erforderlich')
      try {
        const { rows } = await db().query(
          `insert into projekt (code, name) values ($1, $2) returning id, code, name`,
          [code, name],
        )
        return rows[0]
      } catch (e) {
        if ((e as { code?: string }).code === '23505') throw new HttpError(409, 'Code existiert bereits')
        throw e
      }
    },
    { rollen: ['admin'], status: 201 },
  ),
})
