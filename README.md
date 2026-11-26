# Zeiterfassung

Webapplikation zur Zeiterfassung inkl. Ferien- und Absenzenverwaltung, Anmeldung per Microsoft Entra ID (SSO).

## Stand

Grundgerüst: Vite, React, TypeScript, MSAL-Login, Datenmodell (`src/domain`).

## Geplanter Umfang

- Zeiterfassung pro Tag/Projekt
- Ferien und Absenzen mit Antrag und Genehmigung durch Vorgesetzte
- Ferienkontingent nach Pensum, Saldo-Übersicht
- Auswertungen und Export
- Mehrere Nutzer, Rollen: Mitarbeiter, Vorgesetzter, Admin; nur für Mitarbeitende am Standort Pfäffikon (PAS)

## Entwicklung

```bash
npm install
cp .env.example .env.local   # Tenant- und Client-ID eintragen
npm run dev
```

## Architektur (Azure, Region Schweiz)

- Frontend: React/Vite, Anmeldung per MSAL (Entra ID)
- API: Azure Functions (Node/TypeScript) in `api/`, prüft Entra-Token und Gruppenmitgliedschaft
- Datenbank: Azure Database for PostgreSQL, Schema in `db/migrations/`
- Infrastruktur: `infra/main.bicep` (Region `switzerlandnorth`)

### Entra-Konfiguration

- App-Registrierung (Single-Tenant) mit SPA-Plattform und eigenem API-Scope
- Gruppenanspruch (`groups`) im Token aktivieren
- Unternehmensanwendung: «Zuweisung erforderlich» = Ja, Sicherheitsgruppe «Zeiterfassung Pfäffikon» zuweisen
- Die Gruppen-ID kommt als `ENTRA_ALLOWED_GROUP_ID` in die API-Einstellungen

### API lokal

```bash
cd api
cp local.settings.example.json local.settings.json
npm install && npm run build && npm start
```
