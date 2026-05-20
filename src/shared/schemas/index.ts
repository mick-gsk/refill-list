/**
 * Zod Validation Schemas — Single Source of Truth.
 * Wird in Server Actions und API Routes verwendet.
 */
import { z } from 'zod';

// ──────────────────────────────
// Haushalt (RL-01)
// ──────────────────────────────
export const createHouseholdSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  ownerName: z.string().min(1).max(100).trim(),
});

export const joinHouseholdSchema = z.object({
  token: z.string().min(1),
  userName: z.string().min(1).max(100).trim(),
});

// ──────────────────────────────
// Artikel (RL-02, RL-03, RL-07)
// ──────────────────────────────
export const itemStatusSchema = z.enum(['OK', 'LOW', 'EMPTY']);
export const itemStateSchema = z.enum(['AVAILABLE', 'PLANNED', 'PURCHASED', 'ARCHIVED']);

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200).trim(),
  householdId: z.string().cuid(),
  categoryId: z.string().cuid().optional(),
  status: itemStatusSchema.default('LOW'),
  isStandard: z.boolean().default(false),
  quantity: z.number().int().min(1).default(1),
  unit: z.string().max(20).optional(),
  note: z.string().max(500).optional(),
  source: z.enum(['APP', 'SHARE', 'DEEPLINK', 'VOICE', 'WIDGET']).default('APP'),
});

export const updateItemStatusSchema = z.object({
  itemId: z.string().cuid(),
  status: itemStatusSchema,
});

export const updateItemSchema = z.object({
  itemId: z.string().cuid(),
  name: z.string().min(1).max(200).trim().optional(),
  categoryId: z.string().cuid().nullable().optional(),
  isStandard: z.boolean().optional(),
  quantity: z.number().int().min(1).optional(),
  unit: z.string().max(20).optional(),
  note: z.string().max(500).optional(),
});

export const deleteItemSchema = z.object({
  itemId: z.string().cuid(),
});

// ──────────────────────────────
// Inferred Types
// ──────────────────────────────
export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemStatusInput = z.infer<typeof updateItemStatusSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type DeleteItemInput = z.infer<typeof deleteItemSchema>;
