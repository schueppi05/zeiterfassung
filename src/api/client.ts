import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { apiScopes, msalInstance } from '../auth/msal'
import type { AbsenceStatus, AbsenceType, Role } from '../domain/types'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '/api'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function accessToken(): Promise<string> {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  if (!account) throw new ApiError(401, 'Nicht angemeldet')
  try {
    return (await msalInstance.acquireTokenSilent({ scopes: apiScopes, account })).accessToken
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes: apiScopes, account })
    }
    throw e
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, (data as { fehler?: string }).fehler ?? 'Anfrage fehlgeschlagen')
  return data as T
}

export interface Me {
  id: string
  name: string
  email: string
  rolle: Role
  pensum: number
  ferienanspruchTage: number
}
export interface Projekt { id: string; code: string; name: string }
export interface Zeiteintrag {
  id: string
  projektId: string | null
  datum: string
  minuten: number
  beschreibung: string
}
export interface Absenz {
  id: string
  typ: AbsenceType
  von: string
  bis: string
  halberTagVon: boolean
  halberTagBis: boolean
  status: AbsenceStatus
  bemerkung: string
  benutzerName?: string
}
export interface Saldo {
  jahr: number
  anspruch: number
  genommen: number
  beantragt: number
  verbleibend: number
}

export const api = {
  me: () => request<Me>('GET', '/me'),
  projekte: () => request<Projekt[]>('GET', '/projekte'),
  zeiteintraege: (von: string, bis: string) =>
    request<Zeiteintrag[]>('GET', `/zeiteintraege?von=${von}&bis=${bis}`),
  zeitErfassen: (e: { projektId: string | null; datum: string; minuten: number; beschreibung: string }) =>
    request<Zeiteintrag>('POST', '/zeiteintraege', e),
  zeitLoeschen: (id: string) => request<void>('DELETE', `/zeiteintraege/${id}`),
  absenzen: (jahr: number) => request<Absenz[]>('GET', `/absenzen?jahr=${jahr}`),
  absenzBeantragen: (a: {
    typ: AbsenceType
    von: string
    bis: string
    halberTagVon: boolean
    halberTagBis: boolean
    bemerkung: string
  }) => request<Absenz>('POST', '/absenzen', a),
  absenzStornieren: (id: string) => request<unknown>('POST', `/absenzen/${id}/storno`),
  saldo: (jahr: number) => request<Saldo>('GET', `/ferien/saldo?jahr=${jahr}`),
  freigaben: () => request<Absenz[]>('GET', '/freigaben'),
  entscheiden: (id: string, entscheid: 'genehmigt' | 'abgelehnt') =>
    request<unknown>('POST', `/freigaben/${id}`, { entscheid }),
}
