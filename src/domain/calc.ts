import type { Absence } from './types'

/** Zählt Werktage (Mo–Fr) zwischen zwei Daten inklusive; Feiertage folgen in einem späteren Schritt. */
export function werktage(von: string, bis: string): number {
  const start = new Date(von + 'T00:00:00')
  const end = new Date(bis + 'T00:00:00')
  let tage = 0
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const wt = d.getDay()
    if (wt !== 0 && wt !== 6) tage++
  }
  return tage
}

export function absenceTage(a: Pick<Absence, 'von' | 'bis' | 'halberTagVon' | 'halberTagBis'>): number {
  let tage = werktage(a.von, a.bis)
  if (a.halberTagVon) tage -= 0.5
  if (a.halberTagBis && a.von !== a.bis) tage -= 0.5
  return Math.max(tage, 0)
}

export function minutenZuStunden(minuten: number): string {
  const h = Math.floor(minuten / 60)
  const m = minuten % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

/** Ferienanspruch anteilig zum Pensum. */
export function ferienanspruch(tageBei100: number, pensum: number): number {
  return Math.round(((tageBei100 * pensum) / 100) * 2) / 2
}
