import type { ItemCategory, OIInsight } from '@household-inventory/shared';
import { pickProducts, pickResources, productsForStorageArea } from '@household-inventory/shared';
import type { RawCrowdedStorageArea } from './queries';

export function enrichInsightResources(insight: OIInsight): OIInsight {
  const enriched = { ...insight };

  switch (true) {
    case insight.id === 'empty-household':
      enriched.resources = pickResources('konmariBook', 'homeEditNetflix');
      break;

    case insight.id.startsWith('spread-clothing'):
      enriched.resources = pickResources(
        'konmariNetflixShow',
        'konmariFoldingGuide',
        'konmariBook'
      );
      enriched.productPicks = pickProducts('velvetHangers', 'clearShoeBox');
      break;

    case insight.id.startsWith('spread-'):
      enriched.resources = pickResources('homeEditNetflix', 'homeEditBook', 'konmariBook');
      break;

    case insight.id === 'duplicate-items':
      enriched.resources = pickResources('konmariBook', 'konmariFoldingGuide');
      break;

    case insight.id === 'high-quantity':
      enriched.resources = pickResources('containerStoreMeasure', 'homeEditBook');
      enriched.productPicks = pickProducts('pantryBin', 'clearShoeBox');
      break;

    case insight.id === 'empty-storage':
      enriched.resources = pickResources('homeEditNetflix', 'homeEditBook', 'containerStoreMeasure');
      enriched.productPicks = pickProducts('clearShoeBox', 'pantryBin');
      break;

    case insight.id === 'unlabeled-areas':
      enriched.resources = pickResources('homeEditLabels', 'homeEditBook');
      enriched.productPicks = pickProducts('labelMaker');
      break;

    case insight.id.startsWith('mixed-room-'):
      enriched.resources = pickResources('homeEditNetflix', 'homeEditRainbow', 'homeEditBook');
      enriched.productPicks = pickProducts('clearShoeBox', 'labelMaker');
      break;

    case insight.id.startsWith('sparse-'):
      enriched.resources = pickResources('containerStoreMeasure');
      enriched.productPicks = pickProducts('shelfRiser');
      break;

    case insight.id === 'other-category':
      enriched.resources = pickResources('konmariBook', 'konmariFoldingGuide');
      break;

    case insight.id === 'top-category':
      if (insight.relatedCategories?.includes('kitchen')) {
        enriched.resources = pickResources('homeEditNetflix', 'containerStoreDrawerGuide');
        enriched.productPicks = pickProducts('pantryBin', 'linusDrawerOrganizer');
      } else if (insight.relatedCategories?.includes('clothing')) {
        enriched.resources = pickResources('konmariNetflixShow', 'konmariFoldingGuide');
        enriched.productPicks = pickProducts('velvetHangers');
      } else {
        enriched.resources = pickResources('homeEditBook', 'containerStoreMeasure');
      }
      break;

    case insight.id === 'cleaning-spread':
      enriched.resources = pickResources('homeEditNetflix', 'homeEditBook');
      enriched.productPicks = pickProducts('cleaningCaddy', 'pantryBin');
      break;

    case insight.id === 'office-electronics':
      enriched.resources = pickResources('containerStoreDrawerGuide', 'homeEditLabels');
      enriched.productPicks = pickProducts('cableBox', 'linusDrawerOrganizer', 'interDesignDrawerBin');
      break;

    case insight.id.startsWith('messy-drawer-'):
    case insight.id.startsWith('messy-desk-'):
      enriched.resources = pickResources(
        'containerStoreDrawerGuide',
        'containerStoreMeasure',
        'homeEditNetflix'
      );
      break;

    case insight.id.startsWith('messy-closet-'):
    case insight.id === 'clothing-fold':
      enriched.resources = pickResources(
        'konmariNetflixShow',
        'konmariFoldingGuide',
        'konmariBook'
      );
      enriched.productPicks = pickProducts('velvetHangers', 'clearShoeBox');
      break;

    case insight.id.startsWith('messy-shelf-'):
    case insight.id.startsWith('messy-cabinet-'):
      enriched.resources = pickResources('containerStoreMeasure', 'homeEditRainbow');
      enriched.productPicks = pickProducts('shelfRiser', 'clearShoeBox');
      break;

    default:
      if (insight.source === 'konmari') {
        enriched.resources = pickResources('konmariBook', 'konmariFoldingGuide');
      } else if (insight.source === 'home_edit') {
        enriched.resources = pickResources('homeEditBook', 'homeEditNetflix');
      } else if (insight.source === 'container_store') {
        enriched.resources = pickResources('containerStoreMeasure', 'containerStoreDrawerGuide');
      }
  }

  return enriched;
}

export function enrichCrowdedStorageInsight(
  insight: OIInsight,
  area: RawCrowdedStorageArea
): OIInsight {
  const categories = (area.categories ?? []).filter(
    (c): c is ItemCategory => typeof c === 'string'
  );

  return enrichInsightResources({
    ...insight,
    productPicks: productsForStorageArea(
      area.storage_area_type,
      categories,
      Number(area.item_count)
    ),
  });
}

export function enrichAllInsights(
  insights: OIInsight[],
  crowdedAreas: RawCrowdedStorageArea[]
): OIInsight[] {
  const crowdedIds = new Set(crowdedAreas.map((a) => a.storage_area_id));

  return insights.map((item) => {
    if (item.relatedStorageAreaId && crowdedIds.has(item.relatedStorageAreaId)) {
      const area = crowdedAreas.find((a) => a.storage_area_id === item.relatedStorageAreaId);
      if (area) return enrichCrowdedStorageInsight(item, area);
    }
    return enrichInsightResources(item);
  });
}
