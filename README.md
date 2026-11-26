# Zeiterfassung

Webapplikation zur Zeiterfassung inkl. Ferien- und Absenzenverwaltung, Anmeldung per Microsoft Entra ID (SSO).

## Stand

Funktionsfähig (lokal getestet gegen PostgreSQL-Schema, Entra-Login noch nicht gegen echten Tenant getestet):
Zeiterfassung, Ferien- und Absenzenanträge mit Saldo, Freigabe durch Vorgesetzte.

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

### Rollen und Freigabe

Neue Benutzer werden beim ersten Login mit Rolle `mitarbeiter` angelegt. Rollen, Pensum und
Vorgesetzte pflegt vorerst der Admin direkt in der Datenbank:

```sql
update benutzer set rolle = 'admin' where email = '…';
update benutzer set vorgesetzter_id = (select id from benutzer where email = '…') where email = '…';
```

Vorgesetzte sehen und entscheiden Anträge ihrer direkten Mitarbeitenden, Admins alle ausser den eigenen.
Feiertage werden in der Tabelle `feiertag` gepflegt und bei der Berechnung der Absenztage berücksichtigt.

### API lokal

```bash
cd api
cp local.settings.example.json local.settings.json
npm install && npm run build && npm start
```
