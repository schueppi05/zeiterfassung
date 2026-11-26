import { useState } from 'react'
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react'
import { api } from './api/client'
import { authConfigured, loginRequest } from './auth/msal'
import Absenzen from './pages/Absenzen'
import Freigaben from './pages/Freigaben'
import Zeiten from './pages/Zeiten'
import { useLoad } from './useLoad'

function Login() {
  const { instance } = useMsal()
  return (
    <main className="card">
      <h1>Zeiterfassung</h1>
      {authConfigured ? (
        <button onClick={() => instance.loginRedirect(loginRequest)}>Mit Microsoft anmelden</button>
      ) : (
        <p>
          Entra-ID ist noch nicht konfiguriert. Kopiere <code>.env.example</code> nach{' '}
          <code>.env.local</code> und trage Tenant- und Client-ID ein.
        </p>
      )}
    </main>
  )
}

type Tab = 'zeiten' | 'absenzen' | 'freigaben'

function Home() {
  const { instance } = useMsal()
  const me = useLoad(() => api.me(), [])
  const [tab, setTab] = useState<Tab>('zeiten')

  const darfFreigeben = me.data?.rolle === 'vorgesetzter' || me.data?.rolle === 'admin'
  const tabs: [Tab, string][] = [
    ['zeiten', 'Zeiten'],
    ['absenzen', 'Ferien & Absenzen'],
    ...(darfFreigeben ? [['freigaben', 'Freigaben'] as [Tab, string]] : []),
  ]

  return (
    <main className="card">
      <header>
        <h1>Zeiterfassung</h1>
        <span>
          {me.data?.name} <button onClick={() => instance.logoutRedirect()}>Abmelden</button>
        </span>
      </header>
      {me.error && (
        <p className="fehler">
          Zugriff nicht möglich: {me.error}. Ist die API erreichbar und gehörst du zur Gruppe der
          Mitarbeitenden Pfäffikon?
        </p>
      )}
      {me.data && (
        <>
          <nav>
            {tabs.map(([k, l]) => (
              <button key={k} className={k === tab ? 'aktiv' : 'tab'} onClick={() => setTab(k)}>{l}</button>
            ))}
          </nav>
          {tab === 'zeiten' && <Zeiten />}
          {tab === 'absenzen' && <Absenzen />}
          {tab === 'freigaben' && darfFreigeben && <Freigaben />}
        </>
      )}
    </main>
  )
}

export default function App() {
  return (
    <>
      <UnauthenticatedTemplate><Login /></UnauthenticatedTemplate>
      <AuthenticatedTemplate><Home /></AuthenticatedTemplate>
    </>
  )
}
