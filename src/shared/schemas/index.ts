/**
 * Zod Validation Schemas — Single Source of Truth.
 * Werden in Server Actions und API Routes zur Validierung verwendet.
 */
import { z } from 'zod';

export const createListSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(100, 'Name darf maximal 100 Zeichen lang sein')
    .trim(),
});

export const updateListSchema = z.object({
  id: z.string().cuid(),
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(100, 'Name darf maximal 100 Zeichen lang sein')
    .trim()
    .optional(),
});

export const createItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(200, 'Name darf maximal 200 Zeichen lang sein')
    .trim(),
  quantity: z.number().int().min(1).default(1),
  unit: z.string().max(20).optional(),
  note: z.string().max(500).optional(),
  listId: z.string().cuid(),
  categoryId: z.string().cuid().optional(),
});

export const updateItemSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200).trim().optional(),
  quantity: z.number().int().min(1).optional(),
  unit: z.string().max(20).optional(),
  note: z.string().max(500).optional(),
  checked: z.boolean().optional(),
  categoryId: z.string().cuid().nullable().optional(),
});

export const deleteSchema = z.object({
  id: z.string().cuid(),
});

// Inferred Types aus den Schemas
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type DeleteInput = z.infer<typeof deleteSchema>;
