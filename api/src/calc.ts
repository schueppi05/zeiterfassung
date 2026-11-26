/** Berechnung von Absenztagen (Mo–Fr, ohne Feiertage), halbe Tage am Rand möglich. */
export function absenzTage(
  von: string,
  bis: string,
  halberTagVon: boolean,
  halberTagBis: boolean,
  feiertage: Set<string>,
): number {
  const tage: string[] = []
  const end = new Date(bis + 'T00:00:00Z')
  for (const d = new Date(von + 'T00:00:00Z'); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const wt = d.getUTCDay()
    const iso = d.toISOString().slice(0, 10)
    if (wt !== 0 && wt !== 6 && !feiertage.has(iso)) tage.push(iso)
  }
  let n = tage.length
  if (halberTagVon && tage[0] === von) n -= 0.5
  if (halberTagBis && tage.length > 0 && tage[tage.length - 1] === bis && (von !== bis || !halberTagVon)) n -= 0.5
  return Math.max(n, 0)
}

export function anspruchNachPensum(tageBei100: number, pensum: number): number {
  return Math.round(((tageBei100 * pensum) / 100) * 2) / 2
}
