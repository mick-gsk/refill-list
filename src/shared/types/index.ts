/**
 * Shared TypeScript types — framework-agnostisch.
 * Import in Client- und Server-Code erlaubt.
 * Kein Import aus features/ oder components/.
 */

// ──────────────────────────────────────────────
// Branded ID-Types
// ──────────────────────────────────────────────
export type UserId = string & { readonly __brand: 'UserId' };
export type HouseholdId = string & { readonly __brand: 'HouseholdId' };
export type ItemId = string & { readonly __brand: 'ItemId' };
export type CategoryId = string & { readonly __brand: 'CategoryId' };
export type InviteToken = string & { readonly __brand: 'InviteToken' };

// ──────────────────────────────────────────────
// Enums (spiegeln Prisma-Enums, keine direkten Imports)
// ──────────────────────────────────────────────
export type ItemStatus = 'OK' | 'LOW' | 'EMPTY';
export type ItemState = 'AVAILABLE' | 'PLANNED' | 'PURCHASED' | 'ARCHIVED';
export type CycleConfidence = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type HouseholdRole = 'OWNER' | 'MEMBER';
export type HouseholdMemberStatus = 'ACTIVE' | 'REMOVED';
export type HistoryEventType =
  | 'MARKED_LOW'
  | 'MARKED_EMPTY'
  | 'MARKED_OK'
  | 'PURCHASED'
  | 'SUGGESTION_ACCEPTED'
  | 'SUGGESTION_DISMISSED';
export type CaptureSource = 'APP' | 'SHARE' | 'DEEPLINK' | 'VOICE' | 'WIDGET';

// RL-14: berechnete Prioritätsstufe (nicht in DB gespeichert)
export type ItemPriority = 'CRITICAL' | 'SOON' | 'ROUTINE' | 'NO_NEED';

// ──────────────────────────────────────────────
// Domain-Typen
// ──────────────────────────────────────────────
export interface User {
  id: UserId;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Household {
  id: HouseholdId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HouseholdMember {
  id: string;
  householdId: HouseholdId;
  userId: UserId;
  role: HouseholdRole;
  status: HouseholdMemberStatus;
  joinedAt: Date;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface HouseholdInvite {
  id: string;
  token: InviteToken;
  householdId: HouseholdId;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface Category {
  id: CategoryId;
  name: string;
  color: string | null;
  fallbackCycleDays: number;
  householdId: HouseholdId;
}

export interface Item {
  id: ItemId;
  name: string;
  normalizedName: string;
  canonicalItemId: ItemId | null;
  status: ItemStatus;
  itemState: ItemState;
  isStandard: boolean;
  frequencyScore: number;
  avgCycleDays: number | null;
  cycleConfidence: CycleConfidence;
  nextPredictedEmpty: Date | null;
  priorityOverride: boolean;
  priorityOverrideUntil: Date | null;
  note: string | null;
  quantity: number;
  unit: string | null;
  householdId: HouseholdId;
  categoryId: CategoryId | null;
  createdById: UserId | null;
  lastChangedById: UserId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ItemWithCategory = Item & {
  category: Category | null;
  priority: ItemPriority; // berechnet via computePriority()
};

export interface ShoppingHistory {
  id: string;
  eventType: HistoryEventType;
  source: CaptureSource;
  itemId: ItemId;
  itemName: string;
  householdId: HouseholdId;
  triggeredById: UserId | null;
  createdAt: Date;
}
