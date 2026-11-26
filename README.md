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

## Offene Architekturentscheidung

Persistenz und Backend sind noch nicht gewählt (Hosting-Standort Schweiz/EU, Anbindung an Entra ID). Das Datenmodell ist bewusst unabhängig davon gehalten.
