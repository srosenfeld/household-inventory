import { query } from '../../db/client';
import type { ItemCategory, StorageAreaType } from '@household-inventory/shared';

export interface RawCategoryTotal {
  category: ItemCategory;
  item_count: string;
  total_quantity: string;
}

export interface RawCategoryRoom {
  category: ItemCategory;
  room_id: string;
  room_name: string;
  item_count: string;
  total_quantity: string;
}

export interface RawRoomSummary {
  room_id: string;
  room_name: string;
  item_count: string;
  total_quantity: string;
  storage_area_count: string;
  top_categories: ItemCategory[] | null;
}

export interface RawDuplicateRow {
  item_id: string;
  item_name: string;
  room_id: string;
  room_name: string;
  storage_area_id: string;
  storage_area_name: string;
  quantity: string;
  normalized_name: string;
}

export interface RawEmptyStorageArea {
  storage_area_id: string;
  storage_area_name: string;
  storage_area_type: StorageAreaType;
  room_id: string;
  room_name: string;
}

export interface RawHighQuantityItem {
  item_id: string;
  item_name: string;
  category: ItemCategory;
  quantity: string;
  room_name: string;
  storage_area_name: string;
}

export interface RawUnlabeledStorageArea {
  storage_area_id: string;
  storage_area_name: string;
  room_name: string;
  item_count: string;
}

export interface RawCrowdedStorageArea {
  storage_area_id: string;
  storage_area_name: string;
  storage_area_type: StorageAreaType;
  room_id: string;
  room_name: string;
  item_count: string;
  category_count: string;
  categories: ItemCategory[] | null;
}

export async function fetchOIRawData(householdId: string) {
  const [
    categoryTotals,
    categoryByRoom,
    roomSummaries,
    duplicates,
    emptyStorageAreas,
    highQuantityItems,
    unlabeledStorageAreas,
    crowdedStorageAreas,
    counts,
  ] = await Promise.all([
    query<RawCategoryTotal>(
      `SELECT i.category,
              COUNT(*)::text AS item_count,
              COALESCE(SUM(i.quantity), 0)::text AS total_quantity
       FROM items i
       JOIN storage_areas sa ON sa.id = i.storage_area_id
       JOIN rooms r ON r.id = sa.room_id
       WHERE r.household_id = $1
       GROUP BY i.category
       ORDER BY SUM(i.quantity) DESC`,
      [householdId]
    ),
    query<RawCategoryRoom>(
      `SELECT i.category,
              r.id AS room_id,
              r.name AS room_name,
              COUNT(*)::text AS item_count,
              COALESCE(SUM(i.quantity), 0)::text AS total_quantity
       FROM items i
       JOIN storage_areas sa ON sa.id = i.storage_area_id
       JOIN rooms r ON r.id = sa.room_id
       WHERE r.household_id = $1
       GROUP BY i.category, r.id, r.name
       ORDER BY i.category, SUM(i.quantity) DESC`,
      [householdId]
    ),
    query<RawRoomSummary>(
      `SELECT r.id AS room_id,
              r.name AS room_name,
              COUNT(i.id)::text AS item_count,
              COALESCE(SUM(i.quantity), 0)::text AS total_quantity,
              COUNT(DISTINCT sa.id)::text AS storage_area_count,
              (
                SELECT ARRAY_AGG(sub.category ORDER BY sub.qty DESC)
                FROM (
                  SELECT i2.category, SUM(i2.quantity) AS qty
                  FROM items i2
                  JOIN storage_areas sa2 ON sa2.id = i2.storage_area_id
                  WHERE sa2.room_id = r.id
                  GROUP BY i2.category
                  ORDER BY qty DESC
                  LIMIT 3
                ) sub
              ) AS top_categories
       FROM rooms r
       LEFT JOIN storage_areas sa ON sa.room_id = r.id
       LEFT JOIN items i ON i.storage_area_id = sa.id
       WHERE r.household_id = $1
       GROUP BY r.id, r.name
       ORDER BY COALESCE(SUM(i.quantity), 0) DESC`,
      [householdId]
    ),
    query<RawDuplicateRow>(
      `SELECT i.id AS item_id,
              i.name AS item_name,
              r.id AS room_id,
              r.name AS room_name,
              sa.id AS storage_area_id,
              sa.name AS storage_area_name,
              i.quantity::text,
              LOWER(TRIM(i.name)) AS normalized_name
       FROM items i
       JOIN storage_areas sa ON sa.id = i.storage_area_id
       JOIN rooms r ON r.id = sa.room_id
       WHERE r.household_id = $1
         AND LOWER(TRIM(i.name)) IN (
           SELECT LOWER(TRIM(i2.name))
           FROM items i2
           JOIN storage_areas sa2 ON sa2.id = i2.storage_area_id
           JOIN rooms r2 ON r2.id = sa2.room_id
           WHERE r2.household_id = $1
           GROUP BY LOWER(TRIM(i2.name))
           HAVING COUNT(*) > 1
         )
       ORDER BY normalized_name, r.name`,
      [householdId]
    ),
    query<RawEmptyStorageArea>(
      `SELECT sa.id AS storage_area_id,
              sa.name AS storage_area_name,
              sa.type AS storage_area_type,
              r.id AS room_id,
              r.name AS room_name
       FROM storage_areas sa
       JOIN rooms r ON r.id = sa.room_id
       LEFT JOIN items i ON i.storage_area_id = sa.id
       WHERE r.household_id = $1
       GROUP BY sa.id, sa.name, sa.type, r.id, r.name
       HAVING COUNT(i.id) = 0
       ORDER BY r.name, sa.name`,
      [householdId]
    ),
    query<RawHighQuantityItem>(
      `SELECT i.id AS item_id,
              i.name AS item_name,
              i.category,
              i.quantity::text,
              r.name AS room_name,
              sa.name AS storage_area_name
       FROM items i
       JOIN storage_areas sa ON sa.id = i.storage_area_id
       JOIN rooms r ON r.id = sa.room_id
       WHERE r.household_id = $1 AND i.quantity >= 4
       ORDER BY i.quantity DESC, i.name
       LIMIT 20`,
      [householdId]
    ),
    query<RawUnlabeledStorageArea>(
      `SELECT sa.id AS storage_area_id,
              sa.name AS storage_area_name,
              r.name AS room_name,
              COUNT(i.id)::text AS item_count
       FROM storage_areas sa
       JOIN rooms r ON r.id = sa.room_id
       LEFT JOIN items i ON i.storage_area_id = sa.id
       WHERE r.household_id = $1 AND sa.photo_url IS NULL
       GROUP BY sa.id, sa.name, r.name
       HAVING COUNT(i.id) > 0
       ORDER BY COUNT(i.id) DESC
       LIMIT 15`,
      [householdId]
    ),
    query<RawCrowdedStorageArea>(
      `SELECT sa.id AS storage_area_id,
              sa.name AS storage_area_name,
              sa.type AS storage_area_type,
              r.id AS room_id,
              r.name AS room_name,
              COUNT(i.id)::text AS item_count,
              COUNT(DISTINCT i.category)::text AS category_count,
              ARRAY_AGG(DISTINCT i.category) AS categories
       FROM storage_areas sa
       JOIN rooms r ON r.id = sa.room_id
       JOIN items i ON i.storage_area_id = sa.id
       WHERE r.household_id = $1
       GROUP BY sa.id, sa.name, sa.type, r.id, r.name
       HAVING COUNT(i.id) >= 5
          OR (sa.type IN ('drawer', 'desk') AND COUNT(i.id) >= 4)
          OR (sa.type IN ('closet', 'dresser') AND COUNT(i.id) >= 6)
          OR (sa.type IN ('shelf', 'cabinet') AND COUNT(i.id) >= 8)
       ORDER BY COUNT(i.id) DESC
       LIMIT 12`,
      [householdId]
    ),
    query<{ room_count: string; storage_area_count: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM rooms WHERE household_id = $1) AS room_count,
         (SELECT COUNT(*)::text FROM storage_areas sa
          JOIN rooms r ON r.id = sa.room_id WHERE r.household_id = $1) AS storage_area_count`,
      [householdId]
    ),
  ]);

  return {
    categoryTotals: categoryTotals.rows,
    categoryByRoom: categoryByRoom.rows,
    roomSummaries: roomSummaries.rows,
    duplicates: duplicates.rows,
    emptyStorageAreas: emptyStorageAreas.rows,
    highQuantityItems: highQuantityItems.rows,
    unlabeledStorageAreas: unlabeledStorageAreas.rows,
    crowdedStorageAreas: crowdedStorageAreas.rows,
    roomCount: Number(counts.rows[0]?.room_count ?? 0),
    storageAreaCount: Number(counts.rows[0]?.storage_area_count ?? 0),
  };
}
