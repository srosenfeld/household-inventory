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

export const oiInsightSourceSchema = z.enum(['konmari', 'home_edit', 'container_store', 'data']);
export const oiInsightSeveritySchema = z.enum(['info', 'suggestion', 'action']);

export const oiCategoryTotalSchema = z.object({
  category: z.enum(ITEM_CATEGORIES),
  itemCount: z.number().int(),
  totalQuantity: z.number().int(),
});

export const oiCategoryRoomBreakdownSchema = z.object({
  category: z.enum(ITEM_CATEGORIES),
  roomId: z.string().uuid(),
  roomName: z.string(),
  itemCount: z.number().int(),
  totalQuantity: z.number().int(),
});

export const oiRoomSummarySchema = z.object({
  roomId: z.string().uuid(),
  roomName: z.string(),
  itemCount: z.number().int(),
  totalQuantity: z.number().int(),
  storageAreaCount: z.number().int(),
  topCategories: z.array(z.enum(ITEM_CATEGORIES)),
});

export const oiDuplicateItemSchema = z.object({
  itemId: z.string().uuid(),
  itemName: z.string(),
  roomId: z.string().uuid(),
  roomName: z.string(),
  storageAreaId: z.string().uuid(),
  storageAreaName: z.string(),
  quantity: z.number().int(),
});

export const oiDuplicateGroupSchema = z.object({
  normalizedName: z.string(),
  items: z.array(oiDuplicateItemSchema),
});

export const oiEmptyStorageAreaSchema = z.object({
  storageAreaId: z.string().uuid(),
  storageAreaName: z.string(),
  storageAreaType: z.enum(STORAGE_AREA_TYPES),
  roomId: z.string().uuid(),
  roomName: z.string(),
});

export const oiResourceTypeSchema = z.enum(['watch', 'read', 'learn', 'shop']);
export const oiResourceVendorSchema = z.enum([
  'netflix',
  'marie_kondo',
  'home_edit',
  'container_store',
  'amazon',
]);

export const oiResourceLinkSchema = z.object({
  id: z.string(),
  type: oiResourceTypeSchema,
  vendor: oiResourceVendorSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
});

export const oiProductPickSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().url(),
  shopUrl: z.string().url(),
  vendor: z.enum(['container_store', 'amazon']),
  fitNote: z.string().optional(),
});

export const oiInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  severity: oiInsightSeveritySchema,
  source: oiInsightSourceSchema,
  relatedCategories: z.array(z.enum(ITEM_CATEGORIES)).optional(),
  relatedRoomIds: z.array(z.string().uuid()).optional(),
  relatedStorageAreaId: z.string().uuid().optional(),
  contextLabel: z.string().optional(),
  resources: z.array(oiResourceLinkSchema).optional(),
  productPicks: z.array(oiProductPickSchema).optional(),
});

export const oiStatsSchema = z.object({
  totalItems: z.number().int(),
  totalQuantity: z.number().int(),
  roomCount: z.number().int(),
  storageAreaCount: z.number().int(),
  emptyStorageAreaCount: z.number().int(),
  categoryCount: z.number().int(),
});

export const organizationalIntelligenceSchema = z.object({
  householdId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  stats: oiStatsSchema,
  categoryTotals: z.array(oiCategoryTotalSchema),
  categoryByRoom: z.array(oiCategoryRoomBreakdownSchema),
  roomSummaries: z.array(oiRoomSummarySchema),
  duplicateGroups: z.array(oiDuplicateGroupSchema),
  emptyStorageAreas: z.array(oiEmptyStorageAreaSchema),
  insights: z.array(oiInsightSchema),
});

export type OIInsightSource = z.infer<typeof oiInsightSourceSchema>;
export type OIInsightSeverity = z.infer<typeof oiInsightSeveritySchema>;
export type OICategoryTotal = z.infer<typeof oiCategoryTotalSchema>;
export type OICategoryRoomBreakdown = z.infer<typeof oiCategoryRoomBreakdownSchema>;
export type OIRoomSummary = z.infer<typeof oiRoomSummarySchema>;
export type OIDuplicateGroup = z.infer<typeof oiDuplicateGroupSchema>;
export type OIEmptyStorageArea = z.infer<typeof oiEmptyStorageAreaSchema>;
export type OIInsight = z.infer<typeof oiInsightSchema>;
export type OIResourceLink = z.infer<typeof oiResourceLinkSchema>;
export type OIProductPick = z.infer<typeof oiProductPickSchema>;
export type OIResourceType = z.infer<typeof oiResourceTypeSchema>;
export type OIResourceVendor = z.infer<typeof oiResourceVendorSchema>;
export type OIStats = z.infer<typeof oiStatsSchema>;
export type OrganizationalIntelligence = z.infer<typeof organizationalIntelligenceSchema>;
