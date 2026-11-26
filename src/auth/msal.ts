import { PublicClientApplication, type Configuration } from '@azure/msal-browser'

/**
 * Entra-ID-Anmeldung (SSO). Werte kommen aus .env.local (siehe .env.example).
 * Single-Tenant: nur Konten des eigenen Verzeichnisses dürfen sich anmelden.
 */
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID as string | undefined
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID as string | undefined

export const authConfigured = Boolean(tenantId && clientId)

const config: Configuration = {
  auth: {
    clientId: clientId ?? 'nicht-konfiguriert',
    authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage' },
}

export const msalInstance = new PublicClientApplication(config)

export const apiScopes = [
  (import.meta.env.VITE_API_SCOPE as string | undefined) || `api://${clientId}/access_as_user`,
]

export const loginRequest = { scopes: ['openid', 'profile', ...apiScopes] }
