-- HiddenQueen Private Preview – Schema (Neon/Postgres)
-- Einmalig ausfuehren via `npm run migrate` (liest DATABASE_URL).

create table if not exists preview_applications (
  id                  bigserial primary key,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  answers             jsonb not null,
  scores              jsonb not null,
  top_collection      text,
  second_collection   text,
  eignung_score       int not null default 0,

  boundary_text       text,        -- Frage 9
  expectation_text    text,        -- Frage 10

  vorname             text not null,
  nachname            text,
  email               text not null,
  partner_vorname     text,
  plz_ort             text not null,
  telefon             text,
  kontaktweg          text,
  nachricht           text,

  consent_age         boolean not null default false,
  consent_processing  boolean not null default false,
  consent_marketing   boolean not null default false,

  utm_source          text,
  referrer            text,
  ip_hash             text,

  status              text not null default 'Neu',
  internal_note       text
);

create index if not exists idx_preview_status on preview_applications (status);
create index if not exists idx_preview_top_collection on preview_applications (top_collection);
create index if not exists idx_preview_created_at on preview_applications (created_at desc);

create table if not exists rate_limit_events (
  id          bigserial primary key,
  scope       text not null,
  ip_hash     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_rate_limit_scope_ip on rate_limit_events (scope, ip_hash, created_at);

create table if not exists newsletter_signups (
  id            bigserial primary key,
  vorname       text,
  email         text not null,
  token         text not null unique,
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz
);
create index if not exists idx_newsletter_email on newsletter_signups (email);
alter table newsletter_signups add column if not exists vorname text;

create table if not exists analytics_events (
  id          bigserial primary key,
  name        text not null,
  path        text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_analytics_created_at on analytics_events (created_at desc);
