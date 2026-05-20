# refill-list 🛒

> Gemeinsame Haushalts-Einkaufsliste für Familien — mobil-first, kachel-basiert, inspiriert von Bring!

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

## Überblick

refill-list ist eine mobile Web-App, mit der Familien gemeinsam Einkaufslisten führen können. Artikel werden als Touch-Kacheln dargestellt (analog zu Bring!), lassen sich per Tap abhaken und sind in Echtzeit für alle Haushaltsmitglieder sichtbar.

**Kernfunktionen (MVP)**

- 🔲 **Kachelraster** — Artikel als farbkodierte Kacheln nach Kategorie
- ✅ **Tap-to-check** — Artikel mit einem Tap abhaken, sofortiges optimistisches UI-Update
- ↩ **Undo** — abgehakte Artikel direkt zurücklegen
- 👨‍👩‍👧 **Mehrere Haushalte** — jedes Mitglied gehört genau einem Haushalt
- 🔗 **Einladungs-Links** — Haushalt per Token-Link beitreten, kein Passwort-Reset nötig
- 📡 **Echtzeit-Updates** — Änderungen erscheinen via SSE-Stream innerhalb von 5 Sekunden bei allen
- 🔒 **Zugriffschutz** — nur aktive Mitglieder sehen Haushaltsdaten; entfernte Mitglieder verlieren sofort den Zugriff

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Sprache | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Datenbank | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js v5 (Credentials) |
| Echtzeit | Server-Sent Events (SSE) |
| Tests | Vitest (Unit) + Playwright (E2E) |

## Projektstruktur

```
refill-list/
├── prisma/
│   └── schema.prisma          # Datenbankschema
├── src/
│   ├── app/
│   │   ├── api/               # API Routes
│   │   │   ├── household/     # Haushalt CRUD + Invite-Lifecycle
│   │   │   └── items/         # Artikel verwalten
│   │   ├── (app)/             # Authentifizierte App-Seiten
│   │   └── (auth)/            # Login / Register
│   ├── components/
│   │   ├── shell/             # AppHeader, BottomNav
│   │   └── list/              # ShoppingTileGrid
│   ├── features/
│   │   └── items/             # Server Actions (toggleItemStatus)
│   ├── lib/
│   │   ├── auth.ts            # NextAuth-Konfiguration
│   │   ├── db.ts              # Prisma-Client (Singleton)
│   │   └── household.ts       # Auth-Guards (requireActiveMember, requireOwner)
│   └── middleware.ts          # JWT-Guard + öffentliche Pfade
├── tests/                     # Playwright E2E-Tests
├── .env.example
└── PRODUCT_SPEC.md
```

## Lokales Setup

### Voraussetzungen

- Node.js 20+
- PostgreSQL 15+ (lokal oder via Docker)
- pnpm (empfohlen) oder npm

### Installation

```bash
# 1. Repository klonen
git clone https://github.com/mick-gsk/refill-list.git
cd refill-list

# 2. Abhängigkeiten installieren
pnpm install

# 3. Umgebungsvariablen setzen
cp .env.example .env
# .env anpassen: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 4. Datenbank migrieren
npx prisma migrate dev

# 5. Dev-Server starten
pnpm dev
```

Die App läuft danach auf [http://localhost:3000](http://localhost:3000).

### Umgebungsvariablen

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindungs-URL | `postgresql://user:pass@localhost:5432/refilllist` |
| `NEXTAUTH_SECRET` | Zufälliger JWT-Secret (min. 32 Zeichen) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Öffentliche URL der App | `http://localhost:3000` |

## API-Übersicht

### Haushalt

| Methode | Pfad | Beschreibung | Wer |
|---|---|---|---|
| `POST` | `/api/household` | Haushalt erstellen | Jeder Auth.-User |
| `GET` | `/api/household/[id]` | Haushalt-Details | Aktive Mitglieder |
| `PATCH` | `/api/household/[id]` | Name / Einstellungen ändern | Owner |
| `GET` | `/api/household/[id]/members` | Mitgliederliste | Aktive Mitglieder |
| `DELETE` | `/api/household/[id]/members/[userId]` | Mitglied entfernen | Owner |
| `GET` | `/api/household/[id]/stream` | SSE-Echtzeit-Stream | Aktive Mitglieder |

### Einladungen

| Methode | Pfad | Beschreibung | Wer |
|---|---|---|---|
| `POST` | `/api/household/invite` | Neuen Token erzeugen | Owner |
| `GET` | `/api/household/invite/list` | Aktive Einladungen auflisten | Owner |
| `POST` | `/api/household/invite/revoke` | Token widerrufen | Owner |
| `POST` | `/api/household/join` | Haushalt via Token beitreten | Jeder Auth.-User |

## Invite-Lifecycle

Einladungslinks folgen einem klaren Lebenszyklus:

```
Erzeugt → [aktiv, 7 Tage gültig]
    ↓ nach Nutzung
  usedAt gesetzt → Link einmalig verbraucht
    ↓ alternativ
  revokedAt gesetzt → sofort ungültig (Owner-Aktion)
    ↓ oder
  expiresAt überschritten → automatisch abgelaufen
```

Entfernte Mitglieder (`status = REMOVED`) verlieren unmittelbar den Zugriff auf alle Haushaltsdaten. Die Guards `requireActiveMember()` und `requireOwner()` in `src/lib/household.ts` werden in jeder betroffenen Route aufgerufen.

## Tests

```bash
# Unit-Tests (Vitest)
pnpm test

# E2E-Tests (Playwright) — Dev-Server muss laufen
pnpm test:e2e
```

## Roadmap

Der aktuelle Entwicklungsstand und alle offenen Issues sind im [Issue-Tracker](https://github.com/mick-gsk/refill-list/issues) hinterlegt. Die Product Spec findet sich in [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md).

## Lizenz

Privates Projekt — alle Rechte vorbehalten.
