# PRODUCT SPECIFICATION

## Product Name
Refill List

---

# MVP Goals

The MVP should:

- track household consumables
- monitor stock levels
- detect low inventory
- suggest refill timing
- support shared household usage

---

# Primary User

People living:
- alone
- with partners
- in shared apartments
- in family households

who regularly forget to refill important consumables.

---

# Core Features

## Inventory Tracking
Users can:
- create items
- define quantities
- define refill thresholds
- update stock levels

---

## Refill Suggestions
The system should:
- detect low stock
- estimate remaining usage duration
- suggest refill timing

---

## Shared Households
Multiple users can:
- access the same household
- update inventory collaboratively

---

# Core Data Model

## HouseholdItem

```ts
{
  id: string
  name: string
  category: string

  currentAmount: number
  maxAmount: number

  unit: "ml" | "g" | "pcs"

  estimatedDailyUsage: number

  refillThreshold: number

  lastRefilledAt: Date
}
```

---

# UX Goals

- fast interaction
- minimal friction
- mobile-first experience
- high state visibility
- extremely low cognitive load

---

# Future Expansion

## Phase 2
- predictive refill timing
- adaptive consumption learning
- intelligent reminders

## Phase 3
- barcode scanning
- OCR receipt import
- voice interaction

## Phase 4
- smart home integration
- Amazon integration
- autonomous shopping assistance
