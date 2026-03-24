# 🥙 SumUp Dashboard

> [Deutsche Version](#deutsch) | [English Version](#english)

---

## Deutsch

Ein modernes, selbst gehostetes Dashboard zur Auswertung von SumUp-Transaktionen — optimiert für Unternehmen mit mehreren Standorten und Konten.

### Features

- **Mehrere SumUp-Konten** — bis zu 3 API-Keys gleichzeitig, alle Transaktionen in einer Übersicht
- **Standort-Filterung** — Transaktionen nach Mitarbeiter/Standort filtern, farblich kodiert in Charts, Filter-Chips und Tabelle
- **Gestapelter Balken-Chart** — Umsatz pro Tag, aufgeteilt nach Standort, anklickbar zum Filtern
- **Kartentyp-Icons** — Visa, Mastercard, Maestro, Amex, Girocard werden als SVG-Logo angezeigt
- **KPI-Karten** — Gesamtumsatz, erfolgreiche Transaktionen, Umsatz pro Konto
- **Zeitraum-Filterung** — Heute, 7T, 30T, 90T oder eigener Zeitraum
- **Status-Filterung** — Erfolgreich, Fehler, Abbruch, Offen
- **PIN-Schutz** — Zugang zum Dashboard per PIN absichern
- **In-Memory-Cache** — Transaktionen werden permanent gecacht, alle 5 Minuten auf neue geprüft
- **Dark Mode** — Standard dunkel, umschaltbar
- **Responsive** — optimiert für Desktop und Mobilgeräte
- **Ladeanimation** — drehender Döner-Spieß 🥙

### Voraussetzungen

- Node.js 18+
- SumUp-Konto(s) mit API-Keys ([SumUp Developer Portal](https://developer.sumup.com/))

### Installation

```bash
git clone https://github.com/hoktaar/sumup-dashboard.git
cd sumup-dashboard
npm install
cp env.local.example .env.local
# .env.local mit eigenen Werten befüllen
npm run dev
```

### Konfiguration

Kopiere `env.local.example` nach `.env.local` und befülle die Variablen:

```env
# SumUp API Keys (1-3 Konten)
SUMUP_API_KEY_1=sup_sk_...
SUMUP_API_KEY_2=sup_sk_...
SUMUP_API_KEY_3=sup_sk_...

# Anzeigename der Konten
SUMUP_ACCOUNT_NAME_1=Hauptfiliale
SUMUP_ACCOUNT_NAME_2=Zweigstelle Nord
SUMUP_ACCOUNT_NAME_3=Online Shop

# Standort-Namen für Mitarbeiter (Format: email:Anzeigename)
SUMUP_LOCATION_1=filiale1@beispiel.de:Filiale Mitte
SUMUP_LOCATION_2=filiale2@beispiel.de:Filiale Nord

# PIN-Schutz (4-8 Stellen, optional)
DASHBOARD_PIN=1234
```

### Deployment

#### Docker / Coolify / Self-hosted

Das Projekt enthält ein `Dockerfile` für das Deployment auf eigenen Servern:

```bash
docker build -t sumup-dashboard .
docker run -p 3000:3000 --env-file .env.local sumup-dashboard
```

Für [Coolify](https://coolify.io): Repository verbinden, Build Pack auf **Dockerfile** stellen, Umgebungsvariablen eintragen, deployen.

#### Vercel

Repository auf GitHub pushen, auf [vercel.com](https://vercel.com) verbinden, Umgebungsvariablen eintragen, fertig.

### Tech Stack

- [Next.js 16](https://nextjs.org/) — React Framework
- [Tailwind CSS 4](https://tailwindcss.com/) — Styling
- [Recharts](https://recharts.org/) — Charts
- [Lucide React](https://lucide.dev/) — Icons

---

## English

A modern, self-hosted dashboard for analyzing SumUp transactions — optimized for businesses with multiple locations and accounts.

### Features

- **Multiple SumUp accounts** — up to 3 API keys simultaneously, all transactions in one view
- **Location filtering** — filter transactions by employee/location, color-coded in charts, filter chips and table
- **Stacked bar chart** — revenue per day broken down by location, clickable to filter
- **Card type icons** — Visa, Mastercard, Maestro, Amex, Girocard displayed as SVG logos
- **KPI cards** — total revenue, successful transactions, revenue per account
- **Date range filtering** — Today, 7D, 30D, 90D or custom range
- **Status filtering** — Successful, Failed, Cancelled, Pending
- **PIN protection** — secure dashboard access with a PIN code
- **In-memory cache** — transactions cached permanently, polled for new ones every 5 minutes
- **Dark mode** — dark by default, toggleable
- **Responsive** — optimized for desktop and mobile
- **Loading animation** — spinning döner kebab 🥙

### Requirements

- Node.js 18+
- SumUp account(s) with API keys ([SumUp Developer Portal](https://developer.sumup.com/))

### Installation

```bash
git clone https://github.com/hoktaar/sumup-dashboard.git
cd sumup-dashboard
npm install
cp env.local.example .env.local
# Fill in .env.local with your values
npm run dev
```

### Configuration

Copy `env.local.example` to `.env.local` and fill in the variables:

```env
# SumUp API Keys (1-3 accounts)
SUMUP_API_KEY_1=sup_sk_...
SUMUP_API_KEY_2=sup_sk_...
SUMUP_API_KEY_3=sup_sk_...

# Display names for accounts
SUMUP_ACCOUNT_NAME_1=Main Branch
SUMUP_ACCOUNT_NAME_2=North Branch
SUMUP_ACCOUNT_NAME_3=Online Shop

# Location names for employees (format: email:DisplayName)
SUMUP_LOCATION_1=branch1@example.com:City Center
SUMUP_LOCATION_2=branch2@example.com:North Location

# PIN protection (4-8 digits, optional)
DASHBOARD_PIN=1234
```

### Deployment

#### Docker / Coolify / Self-hosted

The project includes a `Dockerfile` for deployment on your own servers:

```bash
docker build -t sumup-dashboard .
docker run -p 3000:3000 --env-file .env.local sumup-dashboard
```

For [Coolify](https://coolify.io): connect the repository, set Build Pack to **Dockerfile**, add environment variables, deploy.

#### Vercel

Push the repository to GitHub, connect on [vercel.com](https://vercel.com), add environment variables, done.

### Tech Stack

- [Next.js 16](https://nextjs.org/) — React Framework
- [Tailwind CSS 4](https://tailwindcss.com/) — Styling
- [Recharts](https://recharts.org/) — Charts
- [Lucide React](https://lucide.dev/) — Icons

### License

MIT
