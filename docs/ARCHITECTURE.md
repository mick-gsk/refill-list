# Architektur-Foundation — refill-list

> Referenz-Dokument für alle KI-Agenten und Entwickler. Stand: 2026-05-20
> Zugehöriges Issue: [RL-22](https://github.com/mick-gsk/refill-list/issues/22)

---

## Inhaltsverzeichnis

1. [Technologie-Stack](#technologie-stack)
2. [Architekturdiagramm](#architekturdiagramm)
3. [Frontend / Backend Grenzen](#frontend--backend-grenzen)
4. [Shared Contracts](#shared-contracts)
5. [State-Strategie](#state-strategie)
6. [Testing-Strategie](#testing-strategie)
7. [PWA-first Entscheidung](#pwa-first-entscheidung)
8. [Coding-Konventionen](#coding-konventionen)

---

## Technologie-Stack

| Schicht | Technologie |
|---|---|
| Frontend | React + Next.js (App Router) |
| Styling | Tailwind CSS, Mobile-first |
| PWA | next-pwa / Service Worker |
| Backend | Next.js Server Actions / API Routes |
| Datenbank | PostgreSQL |
| ORM | [Prisma / Drizzle — noch festzulegen] |
| Validierung | Zod |
| Typen | TypeScript (strict) |
| Tests | Vitest, Testing Library, Playwright |

---

## Architekturdiagramm

```
┌─────────────────────────────────────────────────────┐
│                   Browser / PWA                     │
│  ┌──────────────────────────────────────────────┐  │
│  │            Next.js App (React)               │  │
│  │  ┌─────────────┐   ┌───────────────────────┐ │  │
│  │  │  UI Layer   │   │   Feature Modules     │ │  │
│  │  │ (components)│   │ /features/<name>/     │ │  │
│  │  └─────────────┘   └───────────────────────┘ │  │
│  │            │                   │              │  │
│  │            └────────┬──────────┘              │  │
│  │                     ▼                          │  │
│  │         ┌─────────────────────┐               │  │
│  │         │   Server Actions /  │               │  │
│  │         │    API Routes       │               │  │
│  │         └─────────┬───────────┘               │  │
│  └───────────────────┼───────────────────────────┘  │
└────────────────────── ┼─────────────────────────────┘
                        ▼
              ┌──────────────────┐
              │   PostgreSQL DB  │
              └──────────────────┘
```

---

## Frontend / Backend Grenzen

### Frontend (Client-Komponenten)
- Alle React-Komponenten unter `src/components/` und `src/features/`
- Nur UI-Logik, kein direkter DB-Zugriff
- Kommuniziert ausschließlich über Server Actions oder typisierte API-Routes

### Backend (Server-seitig)
- Server Actions: Datenmutation, Suggestion-Logik, Auth-Checks
- API Routes (`/api/`): Externe Integrationen oder öffentliche Endpunkte
- Datenbankzugriff ausschließlich im Server-Kontext
- Zugriffsschutz: Jede Server Action prüft Session/Auth vor DB-Zugriff

### Regel
> **Nie direkten DB-Zugriff aus Client-Komponenten.** Nur über Server Actions / API Routes.

---

## Shared Contracts

Alle geteilten Typen und Schemas liegen unter `src/shared/`:

```
src/shared/
  types/        # TypeScript-Typen (z. B. Item, Category, User)
  schemas/      # Zod-Validierungsschemas
  models/       # Domain-Modelle (rein typisiert, framework-agnostisch)
```

- Typen aus `src/shared/types/` werden sowohl in Client- als auch Server-Code importiert
- Zod-Schemas in `src/shared/schemas/` dienen als Single Source of Truth für Validierung
- Kein zirkulärer Import: `shared` darf nichts aus `features` oder `components` importieren

---

## State-Strategie

### Server-State
- Verwaltung über **React Server Components** + **Next.js Cache**
- Revalidierung via `revalidatePath` / `revalidateTag` in Server Actions
- Kein Client-seitiger State für persistente Daten (kein Redux, kein Zustand für DB-Daten)

### UI-State
- Lokaler `useState` / `useReducer` für rein UI-spezifische Zustände (z. B. Modal offen/geschlossen)
- Globaler UI-State (z. B. Theme) über React Context — minimal halten

### Caching-Strategie
- Next.js Data Cache für Lesezugriffe (Standard: `no-store` für nutzerspezifische Daten)
- Explizite Cache-Tags für gezielte Revalidierung
- Service Worker Cache (PWA) für statische Assets und Offline-Fähigkeit

---

## Testing-Strategie

| Ebene | Tool | Ziel |
|---|---|---|
| Unit Tests | Vitest | Utility-Funktionen, Shared Schemas, Domain-Logik |
| Component Tests | Vitest + Testing Library | React-Komponenten isoliert testen |
| E2E Tests | Playwright | Kritische User Flows (Hinzufügen, Bearbeiten, Löschen) |

### Regeln
- Testdateien liegen neben dem Quellcode: `*.test.ts` / `*.spec.ts`
- E2E-Tests unter `tests/e2e/`
- Mindest-Coverage für `src/shared/` und Server Actions: 80 %
- Kein Mocking von echter DB in E2E — Testdatenbank verwenden

---

## PWA-first Entscheidung

### Begründung
- refill-list ist primär ein mobiles Einkaufs-Tool — offline-Nutzung ist ein Kernfeature
- PWA ermöglicht Installation ohne App Store, spart Entwicklungsaufwand
- Next.js bietet native PWA-Unterstützung über Service Worker

### Umsetzung
- Service Worker für Offline-Caching statischer Ressourcen
- Web App Manifest (`manifest.json`) mit App-Icon, Farben, Display-Modus (`standalone`)
- Responsive, Mobile-first Design mit Tailwind CSS
- Touch-optimierte Interaktionselemente (44 px Mindest-Tap-Größe)

### Abgrenzung
- Kein React Native / Expo — PWA ist ausreichend für den Use-Case
- Desktop-Nutzung wird unterstützt, aber nicht primär optimiert

---

## Coding-Konventionen

### Verzeichnisstruktur

```
src/
  app/              # Next.js App Router (Seiten, Layouts, API Routes)
  components/       # Wiederverwendbare UI-Komponenten
  features/         # Feature-Module (je Feature ein Verzeichnis)
    <feature>/
      components/
      actions.ts    # Server Actions
      types.ts      # Lokale Typen
  shared/           # Typen, Schemas, Domain-Modelle (kein Framework-Code)
  lib/              # Hilfsfunktionen, DB-Client, Auth-Konfiguration
```

### Benennungsregeln
- Dateien: `kebab-case.ts`
- React-Komponenten: `PascalCase.tsx`
- Funktionen / Variablen: `camelCase`
- Typen / Interfaces: `PascalCase`
- Konstanten: `SCREAMING_SNAKE_CASE`

### TypeScript
- `strict: true` in `tsconfig.json`
- Kein `any` — stattdessen `unknown` + Type Guard
- Explizite Return-Types bei allen Server Actions und API Handlers

### Agentenfreundlichkeit
- Jedes Feature-Modul ist eigenständig und hat ein klares Interface
- Keine impliziten Abhängigkeiten zwischen Features
- Kommentare auf Englisch, kurz und präzise
- Jede öffentliche Funktion hat ein JSDoc-Kommentar mit `@param` und `@returns`
- Maximale Dateigröße: 300 Zeilen — größere Dateien aufteilen
