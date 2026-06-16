import { z } from 'zod';
import { ITEM_CATEGORIES, STORAGE_AREA_TYPES } from './constants';

export const layoutGeometrySchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export const householdSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createHouseholdSchema = z.object({
  name: z.string().min(1).max(100),
});

export const roomSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  name: z.string().min(1),
  photoUrl: z.string().nullable(),
  layoutMetadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createRoomSchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().min(1).max(100),
  photoUrl: z.string().nullable().optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  photoUrl: z.string().nullable().optional(),
  layoutMetadata: z.record(z.unknown()).nullable().optional(),
});

export const storageAreaSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(STORAGE_AREA_TYPES),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  photoUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createStorageAreaSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(STORAGE_AREA_TYPES),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  photoUrl: z.string().nullable().optional(),
});

export const updateStorageAreaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(STORAGE_AREA_TYPES).optional(),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  width: z.number().min(0).max(1).optional(),
  height: z.number().min(0).max(1).optional(),
  photoUrl: z.string().nullable().optional(),
});

export const itemAttributesSchema = z.record(z.string());

export const aiMetadataSchema = z.object({
  confidence: z.number().min(0).max(1).optional(),
  attributes: itemAttributesSchema.optional(),
  rawResponse: z.unknown().optional(),
});

export const itemSchema = z.object({
  id: z.string().uuid(),
  storageAreaId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.enum(ITEM_CATEGORIES),
  quantity: z.number().int().min(1),
  photoUrl: z.string().nullable(),
  aiMetadata: aiMetadataSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createItemSchema = z.object({
  storageAreaId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(ITEM_CATEGORIES),
  quantity: z.number().int().min(1).default(1),
  photoUrl: z.string().nullable().optional(),
  aiMetadata: aiMetadataSchema.optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.enum(ITEM_CATEGORIES).optional(),
  quantity: z.number().int().min(1).optional(),
  photoUrl: z.string().nullable().optional(),
  storageAreaId: z.string().uuid().optional(),
});

export const draftItemSchema = z.object({
  tempId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(ITEM_CATEGORIES),
  quantity: z.number().int().min(1).default(1),
  confidence: z.number().min(0).max(1).optional(),
  attributes: itemAttributesSchema.optional(),
});

export const scanResultSchema = z.object({
  scanJobId: z.string().uuid(),
  items: z.array(draftItemSchema),
});

export const saveScanItemsSchema = z.object({
  scanJobId: z.string().uuid(),
  items: z.array(
    z.object({
      tempId: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(ITEM_CATEGORIES),
      quantity: z.number().int().min(1).default(1),
      aiMetadata: aiMetadataSchema.optional(),
    })
  ),
});

export const nameSuggestionSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(1),
});

export const nameSuggestionsSchema = z.object({
  suggestions: z.array(nameSuggestionSchema),
});

export const searchRequestSchema = z.object({
  householdId: z.string().uuid(),
  query: z.string().min(1).max(500),
});

export const searchMatchSchema = z.object({
  itemId: z.string().uuid(),
  itemName: z.string(),
  description: z.string().nullable(),
  category: z.enum(ITEM_CATEGORIES),
  quantity: z.number().int(),
  photoUrl: z.string().nullable(),
  storageAreaId: z.string().uuid(),
  storageAreaName: z.string(),
  roomId: z.string().uuid(),
  roomName: z.string(),
  score: z.number(),
  matchType: z.enum(['exact', 'fuzzy', 'semantic']),
});

export const searchResponseSchema = z.object({
  query: z.string(),
  parsedQuery: z.string(),
  message: z.string(),
  exactMatch: z.boolean(),
  matches: z.array(searchMatchSchema),
});

export type Household = z.infer<typeof householdSchema>;
export type Room = z.infer<typeof roomSchema>;
export type StorageArea = z.infer<typeof storageAreaSchema>;
export type Item = z.infer<typeof itemSchema>;
export type DraftItem = z.infer<typeof draftItemSchema>;
export type SearchMatch = z.infer<typeof searchMatchSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profilePictureUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  profilePictureUrl: z.string().nullable().optional(),
});

export type User = z.infer<typeof userSchema>;
