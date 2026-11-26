import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { ABSENCE_LABELS, type AbsenceType } from '../domain/types'
import { absenceTage } from '../domain/calc'
import { datumCH, heute } from '../format'
import { useLoad } from '../useLoad'

const STATUS: Record<string, string> = {
  beantragt: 'Beantragt', genehmigt: 'Genehmigt', abgelehnt: 'Abgelehnt', storniert: 'Storniert',
}

const jahr = new Date().getFullYear()

export default function Absenzen() {
  const [typ, setTyp] = useState<AbsenceType>('ferien')
  const [von, setVon] = useState(heute())
  const [bis, setBis] = useState(heute())
  const [halbVon, setHalbVon] = useState(false)
  const [halbBis, setHalbBis] = useState(false)
  const [bemerkung, setBemerkung] = useState('')
  const [fehler, setFehler] = useState<string>()

  const saldo = useLoad(() => api.saldo(jahr), [jahr])
  const liste = useLoad(() => api.absenzen(jahr), [jahr])

  async function beantragen(e: FormEvent) {
    e.preventDefault()
    try {
      await api.absenzBeantragen({ typ, von, bis, halberTagVon: halbVon, halberTagBis: halbBis, bemerkung })
      setBemerkung('')
      setFehler(undefined)
      liste.reload()
      saldo.reload()
    } catch (err) {
      setFehler((err as Error).message)
    }
  }

  async function stornieren(id: string) {
    try {
      await api.absenzStornieren(id)
      liste.reload()
      saldo.reload()
    } catch (err) {
      setFehler((err as Error).message)
    }
  }

  return (
    <section>
      <h2>Ferienkontingent {jahr}</h2>
      {saldo.data && (
        <div className="saldo">
          <div><strong>{saldo.data.anspruch}</strong><span>Anspruch</span></div>
          <div><strong>{saldo.data.genommen}</strong><span>Genommen</span></div>
          <div><strong>{saldo.data.beantragt}</strong><span>Beantragt</span></div>
          <div><strong>{saldo.data.verbleibend}</strong><span>Verbleibend</span></div>
        </div>
      )}
      {saldo.error && <p className="fehler">{saldo.error}</p>}

      <h2>Absenz beantragen</h2>
      <form onSubmit={beantragen} className="form">
        <label>Art
          <select value={typ} onChange={(e) => setTyp(e.target.value as AbsenceType)}>
            {Object.entries(ABSENCE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label>Von <input type="date" value={von} onChange={(e) => setVon(e.target.value)} required /></label>
        <label>Bis <input type="date" value={bis} min={von} onChange={(e) => setBis(e.target.value)} required /></label>
        <label><input type="checkbox" checked={halbVon} onChange={(e) => setHalbVon(e.target.checked)} /> erster Tag halbtags</label>
        <label><input type="checkbox" checked={halbBis} onChange={(e) => setHalbBis(e.target.checked)} /> letzter Tag halbtags</label>
        <label className="breit">Bemerkung <input value={bemerkung} onChange={(e) => setBemerkung(e.target.value)} maxLength={500} /></label>
        <button type="submit">Beantragen</button>
      </form>
      <p className="hinweis">
        Vorschau: {bis >= von ? absenceTage({ von, bis, halberTagVon: halbVon, halberTagBis: halbBis }) : 0} Arbeitstage
        (Feiertage werden bei der Prüfung auf dem Server berücksichtigt).
      </p>
      {fehler && <p className="fehler">{fehler}</p>}

      <h2>Meine Absenzen</h2>
      {liste.loading && <p>Lädt …</p>}
      {liste.error && <p className="fehler">{liste.error}</p>}
      {liste.data && (
        <table>
          <thead><tr><th>Art</th><th>Zeitraum</th><th>Status</th><th>Bemerkung</th><th /></tr></thead>
          <tbody>
            {liste.data.map((a) => (
              <tr key={a.id}>
                <td>{ABSENCE_LABELS[a.typ]}</td>
                <td>{datumCH(a.von)} – {datumCH(a.bis)}</td>
                <td>{STATUS[a.status]}</td>
                <td>{a.bemerkung}</td>
                <td>
                  {(a.status === 'beantragt' || a.status === 'genehmigt') && a.bis >= heute() && (
                    <button className="link" onClick={() => stornieren(a.id)}>Stornieren</button>
                  )}
                </td>
              </tr>
            ))}
            {liste.data.length === 0 && <tr><td colSpan={5}>Keine Absenzen</td></tr>}
          </tbody>
        </table>
      )}
    </section>
  )
}
