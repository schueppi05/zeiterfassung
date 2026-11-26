export const heute = () => new Date().toISOString().slice(0, 10)

export function datumCH(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function stunden(minuten: number): string {
  return `${Math.floor(minuten / 60)}:${String(minuten % 60).padStart(2, '0')}`
}

/** Liest "1:30", "1.5" oder "1,5" (Stunden) und gibt Minuten zurück; sonst null. */
export function parseDauer(eingabe: string): number | null {
  const s = eingabe.trim().replace(',', '.')
  const hm = /^(\d{1,2}):([0-5]\d)$/.exec(s)
  if (hm) return Number(hm[1]) * 60 + Number(hm[2])
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(Number(s) * 60)
  return null
}

export function monatsbereich(monat: string): { von: string; bis: string } {
  const [y, m] = monat.split('-').map(Number)
  const letzter = new Date(y, m, 0).getDate()
  return { von: `${monat}-01`, bis: `${monat}-${String(letzter).padStart(2, '0')}` }
}
