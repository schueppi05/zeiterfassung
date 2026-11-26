/** Fachliches Datenmodell der Zeiterfassung. Datumswerte als ISO-String (YYYY-MM-DD). */

export type Role = 'mitarbeiter' | 'vorgesetzter' | 'admin'

export interface User {
  id: string
  /** Entra-ID Object-ID (oid) */
  entraId: string
  name: string
  email: string
  role: Role
  /** Beschäftigungsgrad in Prozent (z. B. 80) */
  pensum: number
  /** Jährlicher Ferienanspruch in Tagen bei 100 % */
  ferienanspruchTage: number
}

export interface Project {
  id: string
  code: string
  name: string
  aktiv: boolean
}

export interface TimeEntry {
  id: string
  userId: string
  projectId: string | null
  datum: string
  /** Dauer in Minuten */
  minuten: number
  beschreibung: string
}

export type AbsenceType =
  | 'ferien'
  | 'krankheit'
  | 'unfall'
  | 'militaer'
  | 'weiterbildung'
  | 'unbezahlt'
  | 'sonstiges'

export type AbsenceStatus = 'beantragt' | 'genehmigt' | 'abgelehnt' | 'storniert'

export interface Absence {
  id: string
  userId: string
  typ: AbsenceType
  von: string
  bis: string
  /** Halbe Tage am Anfang/Ende möglich */
  halberTagVon: boolean
  halberTagBis: boolean
  status: AbsenceStatus
  bemerkung: string
  genehmigtVon: string | null
}

export const ABSENCE_LABELS: Record<AbsenceType, string> = {
  ferien: 'Ferien',
  krankheit: 'Krankheit',
  unfall: 'Unfall',
  militaer: 'Militär/Zivilschutz',
  weiterbildung: 'Weiterbildung',
  unbezahlt: 'Unbezahlter Urlaub',
  sonstiges: 'Sonstiges',
}
