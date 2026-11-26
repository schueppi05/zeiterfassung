import { useEffect, useState } from 'react'

interface State<T> {
  data?: T
  error?: string
  loading: boolean
}

/** Lädt Daten asynchron und stellt Fehler, Ladezustand und Neuladen bereit. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ loading: true })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let aktiv = true
    fn()
      .then((data) => aktiv && setState({ data, loading: false }))
      .catch((e: Error) => aktiv && setState({ error: e.message, loading: false }))
    return () => {
      aktiv = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { ...state, reload: () => setNonce((n) => n + 1) }
}
