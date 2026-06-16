export const STORAGE_AREA_TYPES = [
  'shelf',
  'bin',
  'drawer',
  'dresser',
  'cabinet',
  'closet',
  'desk',
  'other',
] as const;

export type StorageAreaType = (typeof STORAGE_AREA_TYPES)[number];

export const ITEM_CATEGORIES = [
  'tools',
  'kitchen',
  'clothing',
  'electronics',
  'books',
  'toys',
  'sports',
  'office',
  'cleaning',
  'decor',
  'other',
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const RETAILER_IDS = ['ebay', 'wayfair', 'target'] as const;

export type RetailerId = (typeof RETAILER_IDS)[number];
