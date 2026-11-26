import { app } from '@azure/functions'
import { db } from '../db'
import { HttpError } from '../auth'
import { jsonBody, parseDatum, parseUuid, protectedRoute, text } from '../http'

const SELECT = `select id, projekt_id as "projektId", to_char(datum, 'YYYY-MM-DD') as datum,
                       minuten, beschreibung`

app.http('zeiteintraegeListe', {
  route: 'zeiteintraege',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: protectedRoute(async (req, user) => {
    const heute = new Date().toISOString().slice(0, 10)
    const von = parseDatum(req.query.get('von') ?? heute.slice(0, 8) + '01', 'von')
    const bis = parseDatum(req.query.get('bis') ?? heute.slice(0, 8) + '31', 'bis')
    const { rows } = await db().query(
      `${SELECT} from zeiteintrag
       where benutzer_id = $1 and datum between $2 and $3
       order by datum, erstellt_am`,
      [user.id, von, bis],
    )
    return rows
  }),
})

app.http('zeiteintragErfassen', {
  route: 'zeiteintraege',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: protectedRoute(
    async (req, user) => {
      const b = await jsonBody(req)
      const datum = parseDatum(b.datum)
      const minuten = Number(b.minuten)
      if (!Number.isInteger(minuten) || minuten < 1 || minuten > 1440) {
        throw new HttpError(400, 'Dauer muss zwischen 1 Minute und 24 Stunden liegen')
      }
      const projektId = b.projektId ? parseUuid(b.projektId, 'projektId') : null
      const beschreibung = text(b.beschreibung, 'beschreibung')
      const { rows } = await db().query(
        `with neu as (
           insert into zeiteintrag (benutzer_id, projekt_id, datum, minuten, beschreibung)
           values ($1, $2, $3, $4, $5) returning *
         ) ${SELECT} from neu`,
        [user.id, projektId, datum, minuten, beschreibung],
      )
      return rows[0]
    },
    { status: 201 },
  ),
})

app.http('zeiteintragLoeschen', {
  route: 'zeiteintraege/{id}',
  methods: ['DELETE'],
  authLevel: 'anonymous',
  handler: protectedRoute(async (req, user) => {
    const id = parseUuid(req.params.id)
    const r = await db().query(`delete from zeiteintrag where id = $1 and benutzer_id = $2`, [id, user.id])
    if (r.rowCount === 0) throw new HttpError(404, 'Eintrag nicht gefunden')
    return undefined
  }),
})
