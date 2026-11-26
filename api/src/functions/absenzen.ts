import { app } from '@azure/functions'
import { db } from '../db'
import { HttpError } from '../auth'
import { absenzTage, anspruchNachPensum } from '../calc'
import { jsonBody, parseDatum, parseUuid, protectedRoute, text, type AppUser } from '../http'

const TYPEN = ['ferien', 'krankheit', 'unfall', 'militaer', 'weiterbildung', 'unbezahlt', 'sonstiges']

const SELECT = `select a.id, a.typ, to_char(a.von,'YYYY-MM-DD') as von, to_char(a.bis,'YYYY-MM-DD') as bis,
                       a.halber_tag_von as "halberTagVon", a.halber_tag_bis as "halberTagBis",
                       a.status, a.bemerkung`

async function feiertage(von: string, bis: string): Promise<Set<string>> {
  const { rows } = await db().query(
    `select to_char(datum,'YYYY-MM-DD') as d from feiertag where datum between $1 and $2`,
    [von, bis],
  )
  return new Set(rows.map((r) => r.d as string))
}

function jahrParam(v: string | null): number {
  const j = v ? Number(v) : new Date().getFullYear()
  if (!Number.isInteger(j) || j < 2000 || j > 2100) throw new HttpError(400, 'Jahr ungültig')
  return j
}

/** Absenzen, die der Benutzer als Vorgesetzter/Admin entscheiden darf. */
function freigabeFilter(user: AppUser): { sql: string; params: unknown[] } {
  return user.rolle === 'admin'
    ? { sql: 'a.benutzer_id <> $1', params: [user.id] }
    : { sql: 'b.vorgesetzter_id = $1', params: [user.id] }
}

app.http('absenzenListe', {
  route: 'absenzen',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: protectedRoute(async (req, user) => {
    const jahr = jahrParam(req.query.get('jahr'))
    const { rows } = await db().query(
      `${SELECT} from absenz a
       where a.benutzer_id = $1 and a.bis >= $2 and a.von <= $3
       order by a.von desc`,
      [user.id, `${jahr}-01-01`, `${jahr}-12-31`],
    )
    return rows
  }),
})

app.http('absenzBeantragen', {
  route: 'absenzen',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: protectedRoute(
    async (req, user) => {
      const b = await jsonBody(req)
      if (typeof b.typ !== 'string' || !TYPEN.includes(b.typ)) throw new HttpError(400, 'Typ ungültig')
      const von = parseDatum(b.von, 'von')
      const bis = parseDatum(b.bis, 'bis')
      if (bis < von) throw new HttpError(400, 'Das Enddatum liegt vor dem Startdatum')
      if (von.slice(0, 4) !== bis.slice(0, 4)) {
        throw new HttpError(400, 'Absenzen über den Jahreswechsel bitte getrennt erfassen')
      }
      const halbVon = b.halberTagVon === true
      const halbBis = b.halberTagBis === true
      const bemerkung = text(b.bemerkung, 'bemerkung')

      const tage = absenzTage(von, bis, halbVon, halbBis, await feiertage(von, bis))
      if (tage <= 0) throw new HttpError(400, 'Der Zeitraum enthält keine Arbeitstage')

      const overlap = await db().query(
        `select 1 from absenz
         where benutzer_id = $1 and status in ('beantragt','genehmigt') and von <= $3 and bis >= $2
         limit 1`,
        [user.id, von, bis],
      )
      if (overlap.rowCount) throw new HttpError(409, 'Im Zeitraum besteht bereits eine Absenz')

      const { rows } = await db().query(
        `with neu as (
           insert into absenz (benutzer_id, typ, von, bis, halber_tag_von, halber_tag_bis, bemerkung)
           values ($1, $2::absenz_typ, $3, $4, $5, $6, $7) returning *
         ) ${SELECT} from neu a`,
        [user.id, b.typ, von, bis, halbVon, halbBis, bemerkung],
      )
      return { ...rows[0], tage }
    },
    { status: 201 },
  ),
})

app.http('absenzStornieren', {
  route: 'absenzen/{id}/storno',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: protectedRoute(async (req, user) => {
    const id = parseUuid(req.params.id)
    const r = await db().query(
      `update absenz set status = 'storniert'
       where id = $1 and benutzer_id = $2 and status in ('beantragt','genehmigt') and bis >= current_date`,
      [id, user.id],
    )
    if (r.rowCount === 0) throw new HttpError(409, 'Absenz kann nicht storniert werden')
    return { status: 'storniert' }
  }),
})

app.http('absenzenOffen', {
  route: 'freigaben',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: protectedRoute(
    async (_req, user) => {
      const f = freigabeFilter(user)
      const { rows } = await db().query(
        `${SELECT}, b.name as "benutzerName"
         from absenz a join benutzer b on b.id = a.benutzer_id
         where a.status = 'beantragt' and ${f.sql}
         order by a.von`,
        f.params,
      )
      return rows
    },
    { rollen: ['vorgesetzter', 'admin'] },
  ),
})

app.http('absenzEntscheiden', {
  route: 'freigaben/{id}',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: protectedRoute(
    async (req, user) => {
      const id = parseUuid(req.params.id)
      const b = await jsonBody(req)
      if (b.entscheid !== 'genehmigt' && b.entscheid !== 'abgelehnt') {
        throw new HttpError(400, 'Entscheid ungültig')
      }
      const f = freigabeFilter(user)
      const r = await db().query(
        `update absenz a set status = $${f.params.length + 2}::absenz_status, genehmigt_von = $1
         from benutzer b
         where a.id = $${f.params.length + 1} and b.id = a.benutzer_id
           and a.status = 'beantragt' and a.benutzer_id <> $1 and ${f.sql}`,
        [...f.params, id, b.entscheid],
      )
      if (r.rowCount === 0) throw new HttpError(404, 'Antrag nicht gefunden oder nicht entscheidbar')
      return { status: b.entscheid }
    },
    { rollen: ['vorgesetzter', 'admin'] },
  ),
})

app.http('ferienSaldo', {
  route: 'ferien/saldo',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: protectedRoute(async (req, user) => {
    const jahr = jahrParam(req.query.get('jahr'))
    const von = `${jahr}-01-01`
    const bis = `${jahr}-12-31`
    const frei = await feiertage(von, bis)
    const { rows } = await db().query(
      `select status, to_char(greatest(von, $2::date),'YYYY-MM-DD') as von,
              to_char(least(bis, $3::date),'YYYY-MM-DD') as bis,
              halber_tag_von as "hv", halber_tag_bis as "hb",
              von < $2::date as "vorJahr", bis > $3::date as "nachJahr"
       from absenz
       where benutzer_id = $1 and typ = 'ferien' and status in ('beantragt','genehmigt')
         and bis >= $2 and von <= $3`,
      [user.id, von, bis],
    )
    let genommen = 0
    let beantragt = 0
    for (const r of rows) {
      const t = absenzTage(r.von, r.bis, r.hv && !r.vorJahr, r.hb && !r.nachJahr, frei)
      if (r.status === 'genehmigt') genommen += t
      else beantragt += t
    }
    const anspruch = anspruchNachPensum(user.ferienanspruchTage, user.pensum)
    return { jahr, anspruch, genommen, beantragt, verbleibend: anspruch - genommen - beantragt }
  }),
})
