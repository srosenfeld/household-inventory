import type { SearchMatch, SearchResponse } from '@household-inventory/shared';
import { query } from '../../db/client';
import { generateEmbedding, embeddingToPgVector } from '../ai/embeddings';
import { parseSearchQuery } from '../ai/vision';

interface SearchRow {
  item_id: string;
  item_name: string;
  description: string | null;
  category: string;
  quantity: number;
  photo_url: string | null;
  storage_area_id: string;
  storage_area_name: string;
  room_id: string;
  room_name: string;
  score: number;
  match_type: 'exact' | 'fuzzy' | 'semantic';
}

function formatRelativeTime(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function buildMessage(parsedQuery: string, matches: SearchMatch[], exactMatch: boolean): string {
  if (matches.length === 0) {
    return `No items found matching "${parsedQuery}". Try a different name or check your inventory.`;
  }

  const top = matches[0];
  const location = `${top.roomName} → ${top.storageAreaName}`;

  if (exactMatch) {
    return `Your ${top.itemName} is in ${location}.`;
  }

  if (matches.length === 1) {
    return `Closest match: ${top.itemName} in ${location}.`;
  }

  const alternatives = matches
    .slice(0, 3)
    .map((m) => `${m.itemName} (${m.roomName} → ${m.storageAreaName})`)
    .join(', or ');

  return `No exact match for "${parsedQuery}". Did you mean: ${alternatives}?`;
}

export async function hybridSearch(householdId: string, rawQuery: string): Promise<SearchResponse> {
  const parsedQuery = parseSearchQuery(rawQuery);
  const embedding = await generateEmbedding(parsedQuery);
  const vectorStr = embeddingToPgVector(embedding);

  const ftsResult = await query<SearchRow>(
    `
    SELECT
      i.id AS item_id,
      i.name AS item_name,
      i.description,
      i.category,
      i.quantity,
      i.photo_url,
      sa.id AS storage_area_id,
      sa.name AS storage_area_name,
      r.id AS room_id,
      r.name AS room_name,
      ts_rank(i.search_vector, plainto_tsquery('english', $2)) AS score,
      CASE
        WHEN lower(i.name) = lower($2) THEN 'exact'
        ELSE 'fuzzy'
      END AS match_type
    FROM items i
    JOIN storage_areas sa ON sa.id = i.storage_area_id
    JOIN rooms r ON r.id = sa.room_id
    WHERE r.household_id = $1
      AND i.search_vector @@ plainto_tsquery('english', $2)
    ORDER BY score DESC
    LIMIT 10
    `,
    [householdId, parsedQuery]
  );

  let rows = ftsResult.rows;

  if (rows.length === 0) {
    const semanticResult = await query<SearchRow>(
      `
      SELECT
        i.id AS item_id,
        i.name AS item_name,
        i.description,
        i.category,
        i.quantity,
        i.photo_url,
        sa.id AS storage_area_id,
        sa.name AS storage_area_name,
        r.id AS room_id,
        r.name AS room_name,
        1 - (i.embedding <=> $2::vector) AS score,
        'semantic' AS match_type
      FROM items i
      JOIN storage_areas sa ON sa.id = i.storage_area_id
      JOIN rooms r ON r.id = sa.room_id
      WHERE r.household_id = $1
        AND i.embedding IS NOT NULL
      ORDER BY i.embedding <=> $2::vector
      LIMIT 10
      `,
      [householdId, vectorStr]
    );
    rows = semanticResult.rows.filter((r) => r.score > 0.3);
  }

  const matches: SearchMatch[] = rows.map((row) => ({
    itemId: row.item_id,
    itemName: row.item_name,
    description: row.description,
    category: row.category as SearchMatch['category'],
    quantity: row.quantity,
    photoUrl: row.photo_url,
    storageAreaId: row.storage_area_id,
    storageAreaName: row.storage_area_name,
    roomId: row.room_id,
    roomName: row.room_name,
    score: Number(row.score),
    matchType: row.match_type,
  }));

  const exactMatch = matches.some(
    (m) => m.matchType === 'exact' || m.itemName.toLowerCase() === parsedQuery.toLowerCase()
  );

  return {
    query: rawQuery,
    parsedQuery,
    message: buildMessage(parsedQuery, matches, exactMatch),
    exactMatch,
    matches,
  };
}

export { formatRelativeTime };
