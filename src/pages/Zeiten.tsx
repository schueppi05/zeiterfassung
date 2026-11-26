import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { datumCH, heute, monatsbereich, parseDauer, stunden } from '../format'
import { useLoad } from '../useLoad'

export default function Zeiten() {
  const [monat, setMonat] = useState(heute().slice(0, 7))
  const [datum, setDatum] = useState(heute())
  const [projektId, setProjektId] = useState('')
  const [dauer, setDauer] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [fehler, setFehler] = useState<string>()

  const projekte = useLoad(() => api.projekte(), [])
  const eintraege = useLoad(() => {
    const { von, bis } = monatsbereich(monat)
    return api.zeiteintraege(von, bis)
  }, [monat])

  async function speichern(e: FormEvent) {
    e.preventDefault()
    const minuten = parseDauer(dauer)
    if (!minuten || minuten < 1 || minuten > 1440) {
      setFehler('Bitte eine Dauer wie 1:30 oder 1,5 eingeben (max. 24 Stunden).')
      return
    }
    try {
      await api.zeitErfassen({ projektId: projektId || null, datum, minuten, beschreibung })
      setDauer('')
      setBeschreibung('')
      setFehler(undefined)
      eintraege.reload()
    } catch (err) {
      setFehler((err as Error).message)
    }
  }

  async function loeschen(id: string) {
    try {
      await api.zeitLoeschen(id)
      eintraege.reload()
    } catch (err) {
      setFehler((err as Error).message)
    }
  }

  const projektName = (id: string | null) =>
    projekte.data?.find((p) => p.id === id)?.name ?? '–'
  const total = (eintraege.data ?? []).reduce((s, e) => s + e.minuten, 0)

  return (
    <section>
      <h2>Zeit erfassen</h2>
      <form onSubmit={speichern} className="form">
        <label>Datum <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} required /></label>
        <label>Projekt
          <select value={projektId} onChange={(e) => setProjektId(e.target.value)}>
            <option value="">– ohne Projekt –</option>
            {projekte.data?.map((p) => <option key={p.id} value={p.id}>{p.code} {p.name}</option>)}
          </select>
        </label>
        <label>Dauer <input value={dauer} onChange={(e) => setDauer(e.target.value)} placeholder="1:30" size={6} required /></label>
        <label className="breit">Beschreibung <input value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} maxLength={500} /></label>
        <button type="submit">Speichern</button>
      </form>
      {fehler && <p className="fehler">{fehler}</p>}

      <h2>Übersicht</h2>
      <label>Monat <input type="month" value={monat} onChange={(e) => setMonat(e.target.value)} /></label>
      {eintraege.loading && <p>Lädt …</p>}
      {eintraege.error && <p className="fehler">{eintraege.error}</p>}
      {eintraege.data && (
        <table>
          <thead><tr><th>Datum</th><th>Projekt</th><th>Beschreibung</th><th>Dauer</th><th /></tr></thead>
          <tbody>
            {eintraege.data.map((e) => (
              <tr key={e.id}>
                <td>{datumCH(e.datum)}</td>
                <td>{projektName(e.projektId)}</td>
                <td>{e.beschreibung}</td>
                <td>{stunden(e.minuten)}</td>
                <td><button className="link" onClick={() => loeschen(e.id)}>Löschen</button></td>
              </tr>
            ))}
            {eintraege.data.length === 0 && <tr><td colSpan={5}>Keine Einträge</td></tr>}
          </tbody>
          <tfoot><tr><td colSpan={3}>Total</td><td>{stunden(total)}</td><td /></tr></tfoot>
        </table>
      )}
    </section>
  )
}
