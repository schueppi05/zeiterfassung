import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react'
import { authConfigured, loginRequest } from './auth/msal'
import { ABSENCE_LABELS } from './domain/types'

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

function Home() {
  const { instance, accounts } = useMsal()
  return (
    <main className="card">
      <header>
        <h1>Zeiterfassung</h1>
        <span>
          {accounts[0]?.name}{' '}
          <button onClick={() => instance.logoutRedirect()}>Abmelden</button>
        </span>
      </header>
      <p>Angemeldet. Nächste Schritte: Zeiterfassung, Ferien- und Absenzenverwaltung.</p>
      <h2>Absenztypen</h2>
      <ul>
        {Object.values(ABSENCE_LABELS).map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </main>
  )
}

export default function App() {
  return (
    <>
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        <Home />
      </AuthenticatedTemplate>
    </>
  )
}
