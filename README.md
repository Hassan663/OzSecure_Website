# OZsecureservices — Website

A professional marketing website for **OzSecure Services** (Security · Traffic Control · Cleaning · Labour Hire).

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express (handles quote/contact submissions, with optional email delivery)

```
OZsecureservices/
├─ frontend/   → Next.js website
└─ backend/    → Node/Express API
```

---

## Prerequisites

- **Node.js 18.17+** (Node 20 LTS recommended)
- npm (comes with Node)

Check with:
```bash
node -v
npm -v
```

---

## 1. Run the backend (API)

```bash
cd backend
cp .env.example .env        # then edit .env if you want real email delivery
npm install
npm run dev                 # starts on http://localhost:5000
```

The API exposes:
- `GET  /api/health` — health check
- `POST /api/quote`  — receives quote/contact form submissions

**Email is optional.** If you leave `SMTP_HOST` empty in `.env`, the server runs in
**dev mode** and simply logs each submission to the console — so you can test the
contact form immediately without a mail server. To send real emails, fill in your
SMTP credentials in `.env`.

---

## 2. Run the frontend (website)

In a **second terminal**:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # starts on http://localhost:3000
```

Open **http://localhost:3000**.

The frontend reads `NEXT_PUBLIC_API_URL` (default `http://localhost:5000`) to know
where to send the contact form.

---

## Build for production

**Frontend**
```bash
cd frontend
npm run build
npm start                   # serves the production build on :3000
```

**Backend**
```bash
cd backend
npm start                   # node server.js
```

---

## Project structure

```
frontend/
├─ src/
│  ├─ app/
│  │  ├─ layout.js            # fonts, header/footer, metadata
│  │  ├─ template.js          # page-transition animation
│  │  ├─ page.js              # Home
│  │  ├─ services/page.js
│  │  ├─ about/page.js
│  │  ├─ contact/page.js
│  │  └─ globals.css          # Tailwind + brand utilities
│  ├─ components/             # Header, Footer, Hero, ServiceCard, QuoteForm, …
│  └─ data/
│     ├─ site.js              # contact details, nav, MLN, address
│     └─ services.js          # service copy, stats, process steps
├─ public/                    # logo + shield assets
└─ tailwind.config.js         # brand colour + font tokens

backend/
├─ server.js                  # Express app, CORS, rate limiting
└─ src/
   ├─ routes/quote.js         # validation + handler
   └─ utils/mailer.js         # nodemailer (with dev-mode fallback)
```

---

## Editing content

Most copy and all business details live in **`frontend/src/data/`**:

- `site.js` — phone numbers, email, address, Master Licence No., coverage area
- `services.js` — the four services, feature lists, stats, and process steps

Update those files and the whole site reflects the change — no need to touch the components.

---

## Notes for go-live

- **Verified business details are already in place:** phone `0450 717 765` /
  `0452 511 765`, `info@ozsecuresecurity.com.au`, head office *18A Royal Avenue,
  Birrong NSW 2143*, Master Licence No. `000108023`.
- **Placeholder figures to confirm:** the homepage stat counters
  (sites serviced, callout response time) are indicative — set real numbers in
  `data/services.js`.
- The three new trades (Traffic Control, Cleaning, Labour) use generic
  accreditation wording — confirm the exact tickets/accreditations held before
  publishing.
