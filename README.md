# 💰 Expense Tracker

Mini-applicazione web per la gestione delle spese personali. Dati centralizzati su database, autenticazione multi-device, design dark, installabile come app sul telefono (PWA).

Costruita partendo da una versione precedente in HTML + `localStorage`, evoluta in stack moderno con backend reale e sincronizzazione tra dispositivi.

---

## ✨ Funzionalità

- **Autenticazione** email/password con sessione persistente
- **Gestione transazioni**: inserimento, modifica, eliminazione di spese ed entrate
- **Categorie personalizzabili**: nome, icona (emoji), colore, budget mensile
- **Filtro per mese**: navigazione tra mesi con frecce ◀ ▶, calcolo totali sul mese selezionato
- **Dashboard**: card riepilogative (entrate, spese, saldo), barra di progresso del budget mensile
- **Grafico a torta**: distribuzione delle spese per categoria con tooltip e percentuali
- **Sincronizzazione**: i dati sono accessibili da qualsiasi dispositivo con login
- **Sicurezza per utente**: Row Level Security (RLS) di PostgreSQL garantisce che ciascun utente veda solo i propri dati
- **Responsive**: layout adattivo da mobile a desktop
- **PWA-ready**: installabile sul telefono come app nativa _(in arrivo)_

---

## 🛠️ Stack tecnologico

| Livello | Tecnologia |
|---|---|
| Frontend | [React 18](https://react.dev/) + [Vite](https://vite.dev/) |
| Routing | [React Router](https://reactrouter.com/) |
| Grafici | [Recharts](https://recharts.org/) |
| Date | [date-fns](https://date-fns.org/) |
| Backend / DB | [Supabase](https://supabase.com/) (PostgreSQL gestito) |
| Autenticazione | Supabase Auth (email/password) |
| Hosting | [Vercel](https://vercel.com/) _(in arrivo)_ |
| Mobile | Progressive Web App _(in arrivo)_ |

Stack interamente su **free tier permanente**: nessun costo di esercizio.

---

## 🏗️ Architettura

```
┌──────────────┐
│   Browser    │  ← React app servita da Vercel
│  / Mobile    │
└──────┬───────┘
       │ HTTPS
       │
┌──────▼───────┐
│   Supabase   │  ← PostgreSQL + Auth + REST API
│              │     RLS attiva (multi-utente safe)
└──────────────┘
```

### Schema del database

Due tabelle principali, con RLS attiva e policy basate su `auth.uid()`:

- **`categorie`** — `id`, `user_id`, `nome`, `icona`, `colore`, `budget_mensile`, `ordine`
- **`transazioni`** — `id`, `user_id`, `categoria_id`, `data`, `importo`, `tipo` (spesa / entrata), `descrizione`, `created_at`, `updated_at`

Più una vista `v_riepilogo_mensile` per aggregazioni precalcolate lato DB, un trigger su `updated_at` e una funzione `seed_categorie_default()` per i nuovi utenti.

---

## 🚀 Setup locale

### Prerequisiti

- Node.js ≥ 20.19 (o ≥ 22.12)
- Un progetto Supabase (free tier)

### 1. Clone & install

```bash
git clone <repo-url>
cd expense-tracker
npm install
```

### 2. Variabili d'ambiente

Crea `.env.local` nella root:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Recupera i valori da **Supabase → Project Settings → API**.

### 3. Database

Nel SQL Editor di Supabase, esegui lo schema da `sql/01_schema.sql` (creazione tabelle, indici, RLS, vista, trigger).

Per popolare un nuovo utente con categorie di default:

```sql
select public.seed_categorie_default();
```

### 4. Avvio

```bash
npm run dev
```

L'app è su [http://localhost:5173](http://localhost:5173).

### 5. Build di produzione

```bash
npm run build
npm run preview
```

---

## 📂 Struttura del progetto

```
src/
├── lib/
│   └── supabase.js          # Client Supabase singleton
├── hooks/
│   ├── useAuth.js           # Sessione utente
│   ├── useCategorie.js      # CRUD categorie
│   └── useTransazioni.js    # CRUD transazioni + filtri
├── components/
│   ├── Login.jsx
│   ├── Home.jsx             # Dashboard + form + lista
│   ├── Categorie.jsx        # Gestione categorie
│   └── GraficoSpese.jsx     # Donut chart spese per categoria
├── utils/
│   └── format.js            # Helper formato EUR, date, mesi
├── App.jsx
├── main.jsx
└── index.css

sql/
└── 01_schema.sql            # Schema iniziale del DB
```

---

## 🔐 Sicurezza

- Tutte le tabelle hanno **Row Level Security** abilitata
- Le policy sono basate su `auth.uid() = user_id`: ogni utente accede solo ai propri record
- La chiave `anon` esposta nel client è progettata per essere pubblica — l'accesso ai dati è regolato esclusivamente da RLS
- La `service_role` key non è mai presente nel codice frontend né nei repository

---

## 🗺️ Roadmap

Funzionalità implementate:

- [x] Schema DB con RLS
- [x] Autenticazione email/password
- [x] CRUD transazioni
- [x] CRUD categorie (con picker icona/colore)
- [x] Filtro per mese con navigazione
- [x] Card riepilogative entrate/spese/saldo
- [x] Barra di progresso budget mensile
- [x] Grafico a torta spese per categoria
- [x] Layout responsive (mobile / desktop)
- [x] Import dati storici da `localStorage` legacy

In arrivo:

- [ ] PWA: manifest, service worker, installabile su iPhone/Android
- [ ] Deploy su Vercel
- [ ] Esportazione dati (CSV / Excel)
- [ ] Vista annuale con confronto tra mesi
- [ ] Notifiche su superamento budget
- [ ] Drag & drop per riordinare categorie

---

## 📄 Licenza

Progetto personale. Uso e modifica liberi per scopi non commerciali.