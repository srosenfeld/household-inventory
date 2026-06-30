import type {
  ItemCategory,
  OICategoryRoomBreakdown,
  OICategoryTotal,
  OIDuplicateGroup,
  OIEmptyStorageArea,
  OIInsight,
  OIInsightSeverity,
  OIInsightSource,
  OIRoomSummary,
  OIStats,
  OrganizationalIntelligence,
} from '@household-inventory/shared';
import { ITEM_CATEGORIES } from '@household-inventory/shared';
import { fetchOIRawData, type RawCrowdedStorageArea } from './queries';
import { enrichAllInsights } from './enrich';

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  tools: 'tools',
  kitchen: 'kitchen',
  clothing: 'clothing',
  electronics: 'electronics',
  books: 'books',
  toys: 'toys',
  sports: 'sports',
  office: 'office',
  cleaning: 'cleaning',
  decor: 'décor',
  other: 'miscellaneous',
};

function label(category: ItemCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

function insight(
  id: string,
  title: string,
  body: string,
  severity: OIInsightSeverity,
  source: OIInsightSource,
  extras?: Partial<OIInsight>
): OIInsight {
  return { id, title, body, severity, source, ...extras };
}

function buildDuplicateGroups(
  rows: Awaited<ReturnType<typeof fetchOIRawData>>['duplicates']
): OIDuplicateGroup[] {
  const map = new Map<string, OIDuplicateGroup>();
  for (const row of rows) {
    const existing = map.get(row.normalized_name);
    const item = {
      itemId: row.item_id,
      itemName: row.item_name,
      roomId: row.room_id,
      roomName: row.room_name,
      storageAreaId: row.storage_area_id,
      storageAreaName: row.storage_area_name,
      quantity: Number(row.quantity),
    };
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(row.normalized_name, { normalizedName: row.normalized_name, items: [item] });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
}

function buildInsights(params: {
  stats: OIStats;
  categoryTotals: OICategoryTotal[];
  categoryByRoom: OICategoryRoomBreakdown[];
  roomSummaries: OIRoomSummary[];
  duplicateGroups: OIDuplicateGroup[];
  emptyStorageAreas: OIEmptyStorageArea[];
  highQuantityItems: Awaited<ReturnType<typeof fetchOIRawData>>['highQuantityItems'];
  unlabeledStorageAreas: Awaited<ReturnType<typeof fetchOIRawData>>['unlabeledStorageAreas'];
  crowdedStorageAreas: RawCrowdedStorageArea[];
}): OIInsight[] {
  const {
    stats,
    categoryTotals,
    categoryByRoom,
    roomSummaries,
    duplicateGroups,
    emptyStorageAreas,
    highQuantityItems,
    unlabeledStorageAreas,
    crowdedStorageAreas,
  } = params;
  const insights: OIInsight[] = [];

  if (stats.totalItems === 0) {
    insights.push(
      insight(
        'empty-household',
        'Start your inventory journey',
        'Add rooms, map storage areas, and catalog items to unlock personalized organization insights. Marie Kondo suggests beginning with a clear vision of your ideal home before sorting.',
        'info',
        'konmari'
      )
    );
    return insights;
  }

  const roomsByCategory = new Map<ItemCategory, Set<string>>();
  const roomNamesByCategory = new Map<ItemCategory, string[]>();
  for (const row of categoryByRoom) {
    if (!roomsByCategory.has(row.category)) {
      roomsByCategory.set(row.category, new Set());
      roomNamesByCategory.set(row.category, []);
    }
    roomsByCategory.get(row.category)!.add(row.roomId);
    const names = roomNamesByCategory.get(row.category)!;
    if (!names.includes(row.roomName)) names.push(row.roomName);
  }

  for (const [category, roomIds] of roomsByCategory) {
    if (roomIds.size >= 3) {
      const names = roomNamesByCategory.get(category)!.slice(0, 4).join(', ');
      insights.push(
        insight(
          `spread-${category}`,
          `${label(category)} items span ${roomIds.size} rooms`,
          `Your ${label(category)} items live in ${roomIds.size} rooms (${names}${roomIds.size > 4 ? ', …' : ''}). The KonMari Method groups by category, not location — gather everything in one place to edit, then assign a single home. The Home Edit calls this "edit, categorize, contain."`,
          'suggestion',
          'konmari',
          { relatedCategories: [category], relatedRoomIds: [...roomIds] }
        )
      );
    }
  }

  if (duplicateGroups.length > 0) {
    const top = duplicateGroups.slice(0, 3);
    const examples = top.map((g) => `"${g.items[0].itemName}" (${g.items.length} locations)`).join('; ');
    insights.push(
      insight(
        'duplicate-items',
        `${duplicateGroups.length} possible duplicate item${duplicateGroups.length === 1 ? '' : 's'}`,
        `We found items with the same name in multiple places: ${examples}. Hold each copy and keep only what still serves you — KonMari's "joy check" — then consolidate the rest into one labeled home.`,
        'action',
        'konmari'
      )
    );
  }

  if (highQuantityItems.length > 0) {
    const examples = highQuantityItems
      .slice(0, 3)
      .map((i) => `${i.item_name} (×${i.quantity} in ${i.room_name})`)
      .join('; ');
    insights.push(
      insight(
        'high-quantity',
        'Review items with high quantities',
        `${examples}. Before buying more bins or shelf dividers, edit down to what you truly use. The Container Store recommends measuring what remains, then choosing containers that fit — not the other way around.`,
        'suggestion',
        'container_store'
      )
    );
  }

  if (emptyStorageAreas.length > 0) {
    const examples = emptyStorageAreas
      .slice(0, 3)
      .map((a) => `${a.storageAreaName} (${a.roomName})`)
      .join(', ');
    insights.push(
      insight(
        'empty-storage',
        `${emptyStorageAreas.length} empty storage area${emptyStorageAreas.length === 1 ? '' : 's'}`,
        `These zones have no items yet: ${examples}. The Home Edit says finish editing before containing — repurpose empty bins for categories you're consolidating, or remove them to reduce visual clutter.`,
        'suggestion',
        'home_edit',
        { relatedRoomIds: [...new Set(emptyStorageAreas.map((a) => a.roomId))] }
      )
    );
  }

  if (unlabeledStorageAreas.length >= 2) {
    insights.push(
      insight(
        'unlabeled-areas',
        'Label storage areas with photos',
        `${unlabeledStorageAreas.length} storage areas holding items don't have photos yet. The Home Edit uses clear labels (and photos) so every family member knows where things belong — add area photos in Room Layout.`,
        'suggestion',
        'home_edit'
      )
    );
  }

  for (const room of roomSummaries) {
    const categoriesInRoom = categoryByRoom.filter((c) => c.roomId === room.roomId);
    const distinctCategories = new Set(categoriesInRoom.map((c) => c.category));
    if (distinctCategories.size >= 5 && room.itemCount >= 8) {
      insights.push(
        insight(
          `mixed-room-${room.roomId}`,
          `"${room.roomName}" mixes many categories`,
          `This room holds ${distinctCategories.size} categories across ${room.itemCount} items. The Home Edit recommends dedicated zones — one activity or category per area when possible — so retrieval stays fast and clutter visible.`,
          'suggestion',
          'home_edit',
          { relatedRoomIds: [room.roomId] }
        )
      );
    }
  }

  for (const room of roomSummaries) {
    if (room.storageAreaCount >= 4 && room.itemCount > 0 && room.itemCount / room.storageAreaCount < 2) {
      insights.push(
        insight(
          `sparse-${room.roomId}`,
          `"${room.roomName}" has sparse storage`,
          `${room.storageAreaCount} storage areas but only ${room.itemCount} items — about ${(room.itemCount / room.storageAreaCount).toFixed(1)} items per zone. Consider merging zones or using vertical shelf risers (Container Store) to maximize each shelf before adding more furniture.`,
          'info',
          'container_store',
          { relatedRoomIds: [room.roomId] }
        )
      );
    }
  }

  const otherTotal = categoryTotals.find((c) => c.category === 'other');
  if (otherTotal && otherTotal.itemCount >= 3) {
    const pct = Math.round((otherTotal.itemCount / stats.totalItems) * 100);
    insights.push(
      insight(
        'other-category',
        'Many items are uncategorized',
        `${otherTotal.itemCount} items (${pct}%) are in "other." KonMari's category sweep works best when everything has a clear type — re-tag items so you can see what you own and what might not spark joy anymore.`,
        'suggestion',
        'konmari',
        { relatedCategories: ['other'] }
      )
    );
  }

  if (categoryTotals.length > 0) {
    const top = categoryTotals[0];
    insights.push(
      insight(
        'top-category',
        `Most inventory is ${label(top.category)}`,
        `You have ${top.itemCount} ${label(top.category)} items (${top.totalQuantity} total units) — your largest category. Use this as an anchor when planning consolidation: give ${label(top.category)} a primary room and contain sub-types with clear bins or dividers.`,
        'info',
        'data',
        { relatedCategories: [top.category] }
      )
    );
  }

  const cleaningRooms = roomsByCategory.get('cleaning');
  if (cleaningRooms && cleaningRooms.size >= 2) {
    insights.push(
      insight(
        'cleaning-spread',
        'Cleaning supplies in multiple rooms',
        'Cleaning items appear in more than one room. The Home Edit often keeps a caddy per floor or zone — duplicate only what you use weekly, and store bulk refills in one labeled cabinet.',
        'suggestion',
        'home_edit',
        { relatedCategories: ['cleaning'] }
      )
    );
  }

  const officeRooms = roomsByCategory.get('office');
  const electronicsRooms = roomsByCategory.get('electronics');
  if (officeRooms && electronicsRooms) {
    const shared = [...officeRooms].filter((id) => electronicsRooms.has(id));
    if (shared.length >= 1 && officeRooms.size + electronicsRooms.size >= 4) {
      insights.push(
        insight(
          'office-electronics',
          'Office and electronics overlap',
          'Office and electronics items are spread across several rooms. Container Store cable boxes and desk drawer organizers work best when chargers and accessories live next to the device they serve — consider a single tech zone.',
          'suggestion',
          'container_store',
          { relatedCategories: ['office', 'electronics'] }
        )
      );
    }
  }

  const clothingTotal = categoryTotals.find((c) => c.category === 'clothing');
  const clothingRooms = roomsByCategory.get('clothing');
  if (
    clothingTotal &&
    (clothingTotal.totalQuantity >= 10 ||
      (clothingRooms && clothingRooms.size >= 2 && clothingTotal.itemCount >= 4))
  ) {
    insights.push(
      insight(
        'clothing-fold',
        'Clothing may benefit from a reset',
        `You have ${clothingTotal.totalQuantity} clothing units across ${clothingRooms?.size ?? 1} room(s). Marie Kondo's vertical fold lets you see every piece at once — gather all clothing, edit what no longer fits your life, then fold and stand items upright in drawers or on shelves.`,
        'suggestion',
        'konmari',
        {
          relatedCategories: ['clothing'],
          relatedRoomIds: clothingRooms ? [...clothingRooms] : undefined,
        }
      )
    );
  }

  for (const area of crowdedStorageAreas.slice(0, 5)) {
    const itemCount = Number(area.item_count);
    const categoryCount = Number(area.category_count);
    const type = area.storage_area_type;
    const contextLabel = `${area.room_name} · ${area.storage_area_name}`;
    const categories = (area.categories ?? []).join(', ');

    if (type === 'drawer' || type === 'desk') {
      insights.push(
        insight(
          `messy-drawer-${area.storage_area_id}`,
          `"${area.storage_area_name}" drawer is crowded`,
          `${itemCount} items${categoryCount > 1 ? ` across ${categoryCount} categories (${categories})` : ''} share this ${type}. Measure the interior, then use modular dividers so everything has a dedicated slot — The Home Edit's "contain" step.`,
          'action',
          'container_store',
          {
            relatedStorageAreaId: area.storage_area_id,
            relatedRoomIds: [area.room_id],
            contextLabel,
          }
        )
      );
    } else if (type === 'closet' || type === 'dresser') {
      const hasClothing = area.categories?.includes('clothing');
      insights.push(
        insight(
          `messy-closet-${area.storage_area_id}`,
          `"${area.storage_area_name}" needs breathing room`,
          `${itemCount} items in this ${type}${hasClothing ? ', including clothing' : ''}. ${hasClothing ? 'Try the KonMari vertical fold and slim hangers so pieces stand visible side-by-side.' : 'Group like items in clear boxes so nothing hides behind stacks.'}`,
          'suggestion',
          hasClothing ? 'konmari' : 'home_edit',
          {
            relatedStorageAreaId: area.storage_area_id,
            relatedRoomIds: [area.room_id],
            relatedCategories: hasClothing ? ['clothing'] : undefined,
            contextLabel,
          }
        )
      );
    } else if (type === 'shelf' || type === 'cabinet') {
      insights.push(
        insight(
          `messy-shelf-${area.storage_area_id}`,
          `"${area.storage_area_name}" shelf is overloaded`,
          `${itemCount} items on this ${type} — taller stacks hide what you own. Shelf risers or uniform bins create a second row and keep categories visible, a Container Store staple for pantry and linen shelves.`,
          'suggestion',
          'container_store',
          {
            relatedStorageAreaId: area.storage_area_id,
            relatedRoomIds: [area.room_id],
            contextLabel,
          }
        )
      );
    }
  }

  const severityOrder: Record<OIInsightSeverity, number> = { action: 0, suggestion: 1, info: 2 };
  return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export async function buildOrganizationalIntelligence(
  householdId: string
): Promise<OrganizationalIntelligence> {
  const raw = await fetchOIRawData(householdId);

  const categoryTotals: OICategoryTotal[] = raw.categoryTotals.map((row) => ({
    category: row.category,
    itemCount: Number(row.item_count),
    totalQuantity: Number(row.total_quantity),
  }));

  const categoryByRoom: OICategoryRoomBreakdown[] = raw.categoryByRoom.map((row) => ({
    category: row.category,
    roomId: row.room_id,
    roomName: row.room_name,
    itemCount: Number(row.item_count),
    totalQuantity: Number(row.total_quantity),
  }));

  const roomSummaries: OIRoomSummary[] = raw.roomSummaries.map((row) => ({
    roomId: row.room_id,
    roomName: row.room_name,
    itemCount: Number(row.item_count),
    totalQuantity: Number(row.total_quantity),
    storageAreaCount: Number(row.storage_area_count),
    topCategories: (row.top_categories ?? []).filter((c): c is ItemCategory =>
      (ITEM_CATEGORIES as readonly string[]).includes(c)
    ),
  }));

  const duplicateGroups = buildDuplicateGroups(raw.duplicates);

  const emptyStorageAreas: OIEmptyStorageArea[] = raw.emptyStorageAreas.map((row) => ({
    storageAreaId: row.storage_area_id,
    storageAreaName: row.storage_area_name,
    storageAreaType: row.storage_area_type,
    roomId: row.room_id,
    roomName: row.room_name,
  }));

  const totalItems = categoryTotals.reduce((sum, c) => sum + c.itemCount, 0);
  const totalQuantity = categoryTotals.reduce((sum, c) => sum + c.totalQuantity, 0);

  const stats: OIStats = {
    totalItems,
    totalQuantity,
    roomCount: raw.roomCount,
    storageAreaCount: raw.storageAreaCount,
    emptyStorageAreaCount: emptyStorageAreas.length,
    categoryCount: categoryTotals.length,
  };

  const insights = enrichAllInsights(
    buildInsights({
      stats,
      categoryTotals,
      categoryByRoom,
      roomSummaries,
      duplicateGroups,
      emptyStorageAreas,
      highQuantityItems: raw.highQuantityItems,
      unlabeledStorageAreas: raw.unlabeledStorageAreas,
      crowdedStorageAreas: raw.crowdedStorageAreas,
    }),
    raw.crowdedStorageAreas
  );

  return {
    householdId,
    generatedAt: new Date().toISOString(),
    stats,
    categoryTotals,
    categoryByRoom,
    roomSummaries,
    duplicateGroups,
    emptyStorageAreas,
    insights,
  };
}
