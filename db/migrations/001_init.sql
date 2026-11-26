-- Zeiterfassung: Grundschema (PostgreSQL)

create type rolle as enum ('mitarbeiter', 'vorgesetzter', 'admin');
create type absenz_typ as enum
  ('ferien', 'krankheit', 'unfall', 'militaer', 'weiterbildung', 'unbezahlt', 'sonstiges');
create type absenz_status as enum ('beantragt', 'genehmigt', 'abgelehnt', 'storniert');

create table benutzer (
  id uuid primary key default gen_random_uuid(),
  entra_id text not null unique,
  name text not null,
  email text not null,
  rolle rolle not null default 'mitarbeiter',
  pensum int not null default 100 check (pensum between 1 and 100),
  ferienanspruch_tage numeric(4,1) not null default 25,
  vorgesetzter_id uuid references benutzer(id),
  erstellt_am timestamptz not null default now()
);

create table projekt (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  aktiv boolean not null default true
);

create table zeiteintrag (
  id uuid primary key default gen_random_uuid(),
  benutzer_id uuid not null references benutzer(id),
  projekt_id uuid references projekt(id),
  datum date not null,
  minuten int not null check (minuten > 0 and minuten <= 1440),
  beschreibung text not null default '',
  erstellt_am timestamptz not null default now()
);
create index on zeiteintrag (benutzer_id, datum);

create table absenz (
  id uuid primary key default gen_random_uuid(),
  benutzer_id uuid not null references benutzer(id),
  typ absenz_typ not null,
  von date not null,
  bis date not null,
  halber_tag_von boolean not null default false,
  halber_tag_bis boolean not null default false,
  status absenz_status not null default 'beantragt',
  bemerkung text not null default '',
  genehmigt_von uuid references benutzer(id),
  erstellt_am timestamptz not null default now(),
  check (bis >= von)
);
create index on absenz (benutzer_id, von);

create table feiertag (
  datum date primary key,
  name text not null
);
