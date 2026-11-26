import { useState } from 'react'
import { api } from '../api/client'
import { ABSENCE_LABELS } from '../domain/types'
import { datumCH } from '../format'
import { useLoad } from '../useLoad'

export default function Freigaben() {
  const liste = useLoad(() => api.freigaben(), [])
  const [fehler, setFehler] = useState<string>()

  async function entscheiden(id: string, e: 'genehmigt' | 'abgelehnt') {
    try {
      await api.entscheiden(id, e)
      setFehler(undefined)
      liste.reload()
    } catch (err) {
      setFehler((err as Error).message)
    }
  }

  return (
    <section>
      <h2>Offene Anträge</h2>
      {liste.loading && <p>Lädt …</p>}
      {(liste.error || fehler) && <p className="fehler">{liste.error ?? fehler}</p>}
      {liste.data && (
        <table>
          <thead><tr><th>Mitarbeiter</th><th>Art</th><th>Zeitraum</th><th>Bemerkung</th><th /></tr></thead>
          <tbody>
            {liste.data.map((a) => (
              <tr key={a.id}>
                <td>{a.benutzerName}</td>
                <td>{ABSENCE_LABELS[a.typ]}</td>
                <td>{datumCH(a.von)} – {datumCH(a.bis)}</td>
                <td>{a.bemerkung}</td>
                <td>
                  <button onClick={() => entscheiden(a.id, 'genehmigt')}>Genehmigen</button>{' '}
                  <button className="sekundaer" onClick={() => entscheiden(a.id, 'abgelehnt')}>Ablehnen</button>
                </td>
              </tr>
            ))}
            {liste.data.length === 0 && <tr><td colSpan={5}>Keine offenen Anträge</td></tr>}
          </tbody>
        </table>
      )}
    </section>
  )
}
