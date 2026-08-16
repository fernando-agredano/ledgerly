<div align="center">

# Ledgerly

**Institutional private credit platform for SMEs**

A complete LOS/LMS (Loan Origination & Servicing System) — not a dashboard with
charts, but the entire lifecycle of a loan: origination, scoring, committee,
disbursement, double-entry accounting ledger, collections and portfolio
monitoring, with real persistence in a database.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&labelColor=20232a)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%7C%20Auth%20%7C%20Storage%20%7C%20Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

![Ledgerly Dashboard](public/Preview.png)

</div>

## Contents

- [What is this?](#what-is-this)
- [Features](#features)
- [Stack](#stack)
- [Data model](#data-model)
- [How to run it](#how-to-run-it)
- [Project structure](#project-structure)
- [Context for AI-assisted development](#context-for-ai-assisted-development)

## What is this?

Ledgerly simulates an institutional SOFOM that finances Mexican SMEs through
real estate collateral and promissory notes, with proprietary funding through
a revolving bank credit line. The goal of the project was to build the
complete operating system behind that business — not a visual demo, but a
real flow where every screen reads from and writes to a database with
business rules, row-level security and genuine accounting traceability.

This means actions have real consequences within the system: approving a
loan in committee moves it to disbursement, disbursing a loan automatically
generates its double-entry accounting entries (debit to current portfolio,
credit to banks), and every financial report is built from that same data —
never from numbers invented on the frontend.

## Features

**Origination and underwriting**
- Application pipeline with stages (evaluation → analysis → committee →
  approved/rejected → disbursed) and a digital file per application.
- Composite scoring (KYC, payment capacity, collateral, legal, profitability)
  and risk classification.
- AML/CFT validations against sanctions lists (OFAC, UN, SAT 69-B, PEP,
  beneficial owner, adverse media).
- Credit committee with votes, approved conditions and decision log.
- Disbursement with funding flow, dual control and automatic generation of
  accounting entries.

**Portfolio and collections**
- 360° view of each loan: conditions, amortization schedule, downloadable
  account statement in PDF.
- Collections by delinquency bucket (early, intensive, legal) with automatic
  alerts, action log and payment agreement generation.
- Recurring documents per loan (financial statements, 32-D opinion,
  appraisals) with expiration alerts.

**Accounting and reports**
- Immutable double-entry ledger with an institutional chart of accounts,
  SPEI reconciliation and general ledger.
- Automatic provisions by delinquency bucket (1% / 5% / 15% / 35% / 75%).
- **16 real reports** (financial, portfolio, regulatory and operational) that
  are generated as PDFs with an institutional, invoice-like format — folio,
  period, summary cards and tables — from real data, with a history of every
  download.

**Risk**
- Concentration by client/sector (Herfindahl index), vintage/cohort analysis,
  early-warning indicators and stress-testing scenarios (rate shocks,
  collateral deterioration, currency depreciation).

**Platform**
- Real login with Supabase Auth (persistent session) and profile photo in
  Supabase Storage.
- Real-time notifications (Supabase Realtime) when the portfolio, documents
  or the application pipeline change.
- Reusable toast notification system throughout the app.
- Row Level Security on all operational tables.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| Data components | Material UI (Dashboard only) · Recharts |
| Backend | Supabase — Postgres, Auth, Storage, Realtime, Row Level Security |
| Documents | jsPDF + jspdf-autotable (PDFs with institutional letterhead) |
| Routing | React Router v6 |

## Data model

The database (Postgres via Supabase) models the business with:

- **Real double-entry accounting**: `cuentas_contables` (chart of accounts)
  + `asientos_contables` (immutable ledger) + `v_libro_mayor` (derived
  balances) — a "balance" is never stored directly, it is always calculated
  from the movements.
- **Materialized views for each screen**: dashboard KPIs, portfolio aging,
  concentration, vintage, collections alerts — the UI never aggregates
  data client-side that the database should be calculating.
- **RLS on all operational tables**: public read access for the demo,
  write access restricted to authenticated users.
- Full schema details, migrations and how to reproduce it in
  [`supabase/README.md`](supabase/README.md).

## How to run it

```bash
npm install
cp .env.example .env.local   # fill in with your Supabase URL and anon key
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server (Vite) |
| `npm run build` | Type-check (`tsc`) + production build |
| `npm run preview` | Serves the production build locally |

## Project structure

```
src/
├── pages/          # One page per route (Dashboard, Solicitudes, Cartera, Reportes...)
├── components/      # Shared components (Sidebar, Topbar, Logo, ui/*)
├── hooks/           # useAuth, useProfile, useToast, useFetch
├── lib/             # api.ts (Supabase), format.ts, pdf.ts, types.ts
└── layouts/         # AuthLayout (login) and authenticated layout

supabase/
├── migrations/       # Versioned schema, applied with `supabase db push`
├── seed*.sql        # Seed data (clients, loans, funding, pipeline)
└── README.md        # How to reproduce the full database
```

## Context for AI-assisted development

The following files **are not part of the application** — the frontend never
imports or executes them. They are domain context meant for working in this
repo with an AI coding assistant (Claude Code):

| File / folder | Purpose |
|---|---|
| `CLAUDE.md` | Project instructions the assistant loads automatically: institutional identity, how it should think (CRO/CFO/Head of Credit), what it must always analyze in each task. |
| `knowledge/` | Domain glossary and business rules (accounting, collections, compliance, scoring, treasury, profitability) that serve as a quick reference for the assistant. |
| `agents/` | Specialty definitions (credit risk, collections, legal, treasury) designed as subagents focused on a single domain. |
| `memory/` | Log of institutional decisions to be recorded (exceptions, policy adjustments, committee decisions). |
| `scenarios/` | Stress cases to consider in risk analysis (rate shocks, collateral deterioration, currency depreciation). |

The idea is that any development task on this repo — adding a report,
adjusting scoring, reviewing a collections policy — is resolved with the
same institutional judgment a real risk team would use, instead of relying
on each session repeating that context from scratch.

---

<div align="center">

Made by **Fernando Agredano**

</div>
