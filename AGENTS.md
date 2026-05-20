# AGENTS.md

## Mission
Refill List is a household consumption intelligence system.
The goal is not a simple shopping list.
The system should understand household state, consumption velocity, refill timing, and purchasing behavior.

---

## Core Principles

- Strict TypeScript only
- No `any` types
- Feature-first architecture
- Mobile-first UI
- Accessibility required
- Reusable components only
- Business logic must never live in UI components
- Predictability over cleverness
- Prefer explicit naming over abbreviations

---

## Stack

### Frontend
- Next.js 15
- React
- TypeScript
- TailwindCSS
- shadcn/ui

### Backend
- Supabase
- PostgreSQL
- Drizzle ORM

---

## Folder Conventions

/apps
/packages
/docs

Feature folders should contain:
- components
- hooks
- services
- types
- utils

---

## Code Standards

- Prefer pure functions
- Prefer composition over inheritance
- No deeply nested components
- Avoid hidden side effects
- Keep components small and focused

---

## Naming

- Components: PascalCase
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- File names: kebab-case

---

## UX Principles

- Fast interaction loops
- Minimal friction
- One-thumb mobile usage
- High readability
- State clarity is critical

---

## Architecture Goals

- AI-agent friendly repository structure
- Clear domain separation
- Deterministic state management
- Scalable data model
- Future AI integration ready

---

## Testing

Required:
- Unit tests
- Integration tests
- E2E tests

Target:
- High business logic coverage
- Critical flow coverage
