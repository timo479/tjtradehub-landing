# TJ TradeHub – Deployment auf Proxmox / eigenem Server

## Überblick

**Stack:**
- Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- next-auth v5 (JWT, Credentials Provider)
- Supabase (PostgreSQL)
- Stripe (Zahlungen, $29/mo CHF)
- Docker für das Deployment

---

## Voraussetzungen auf dem Server (Ubuntu/Debian VM auf Proxmox)

```bash
# Docker installieren
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose (ist bei Docker Desktop dabei, sonst:)
sudo apt install docker-compose-plugin -y

# Git
sudo apt install git -y
```

---

## 1. Code auf den Server bringen

```bash
# Option A: Von GitHub/GitLab klonen (empfohlen)
git clone https://github.com/DEIN-USER/tjtradehub-landing.git
cd tjtradehub-landing

# Option B: Per SCP vom Mac übertragen
# scp -r ~/Desktop/tjtradehub-landing user@SERVER-IP:/home/user/
```

---

## 2. Environment Variables setzen

```bash
cp .env.example .env.local
nano .env.local   # oder: vim .env.local
```

Folgende Werte eintragen:

| Variable | Wo finden |
|----------|-----------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://deine-domain.com` |
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys (Live Key) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_PRICE_ID` | Stripe Dashboard → Product catalog → Produkt → Price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → Endpoint hinzufügen |
| `NEXT_PUBLIC_APP_URL` | `https://deine-domain.com` |

### Stripe Webhook für Production einrichten

Im Stripe Dashboard:
1. **Developers** → **Webhooks** → **"Add endpoint"**
2. URL: `https://deine-domain.com/api/stripe/webhook`
3. Events auswählen:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. **Signing secret** kopieren → `STRIPE_WEBHOOK_SECRET`

---

## 3. Supabase Datenbankschema

Falls noch nicht ausgeführt – im Supabase SQL Editor:

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  trial_starts_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  stripe_customer_id TEXT UNIQUE,
  subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trialing',
  current_period_end TIMESTAMPTZ
);
```

---

## 4. App starten

```bash
# Image bauen und Container starten
docker compose up -d --build

# Logs prüfen
docker compose logs -f

# Status
docker compose ps
```

App läuft auf: `http://SERVER-IP:3000`

---

## 5. Nginx Reverse Proxy + SSL (empfohlen)

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

```nginx
# /etc/nginx/sites-available/tjtradehub
server {
    server_name deine-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tjtradehub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL-Zertifikat
sudo certbot --nginx -d deine-domain.com
```

---

## 6. Updates deployen

```bash
cd tjtradehub-landing
git pull
docker compose up -d --build
```

---

## Projektstruktur (Übersicht für Claude)

```
tjtradehub-landing/
├── app/
│   ├── page.tsx                    ← Landing Page
│   ├── layout.tsx                  ← Root Layout (SessionProvider)
│   ├── register/page.tsx           ← Registrierung → 7-Tage Trial
│   ├── login/page.tsx              ← Login
│   ├── dashboard/
│   │   ├── layout.tsx              ← Auth-Guard (redirect wenn kein Zugang)
│   │   └── page.tsx                ← Dashboard + Trial-Banner
│   ├── billing/page.tsx            ← Upgrade-Seite (Stripe Checkout)
│   └── api/
│       ├── auth/[...nextauth]/     ← NextAuth Handler
│       ├── register/               ← POST: User anlegen + bcrypt
│       └── stripe/
│           ├── create-checkout/    ← Stripe Checkout Session erstellen
│           └── webhook/            ← Stripe Events → DB updaten
├── components/
│   ├── auth/
│   │   ├── AuthLayout.tsx          ← Dark-Theme Layout für Auth-Seiten
│   │   ├── RegisterForm.tsx        ← Registrierungsformular (Client)
│   │   └── LoginForm.tsx           ← Login-Formular (Client)
│   ├── SignOutButton.tsx            ← Logout Button (Client)
│   ├── Header.tsx                  ← Navigation
│   ├── Hero.tsx                    ← Hero-Sektion
│   ├── PricingSection.tsx          ← Preise
│   └── FinalCTA.tsx                ← CTA-Sektion
├── lib/
│   ├── auth.ts                     ← NextAuth Konfiguration + JWT-Refresh alle 5min
│   ├── db.ts                       ← Supabase Service-Role Client
│   ├── stripe.ts                   ← Stripe Client
│   └── trial.ts                    ← isTrialActive(), getDaysRemaining()
├── types/
│   └── next-auth.d.ts              ← Session Types (trialEndsAt, subscriptionStatus)
├── auth.config.ts                  ← Edge-kompatible NextAuth-Config (für Middleware)
├── proxy.ts                        ← Route-Schutz (Next.js 16: middleware → proxy)
├── Dockerfile                      ← Docker Build
├── docker-compose.yml              ← Docker Compose
├── .env.example                    ← Template für Environment Variables
└── .env.local                      ← Secrets (NICHT committen, in .gitignore)
```

---

## Auth-Flow (Zusammenfassung)

```
Landing Page → /register → Account + Trial (7 Tage) → /dashboard
                                                            ↓
                                               Trial läuft → Banner zeigt Tage
                                               Trial abgelaufen → redirect /billing
                                                            ↓
                                               Stripe Checkout → $29/mo CHF
                                                            ↓
                                               Webhook → DB update → Dashboard ohne Banner
```

---

## Wichtige Hinweise

- **Test → Live wechseln**: In Stripe `sk_test_` → `sk_live_` und `pk_test_` → `pk_live_` in `.env.local`
- **Stripe Webhook Secret**: Für Production im Dashboard neu anlegen (anderer Secret als lokal)
- **NEXTAUTH_URL**: Muss zur echten Domain passen, sonst schlägt Login fehl
- **Supabase**: Dasselbe Projekt kann für Test und Production verwendet werden
