import type { ItemCategory, StorageAreaType } from '../constants';
import type { OIProductPick, OIResourceLink } from '../schemas';

/** Curated learn/watch/read links — editorial, not affiliate. */
export const OI_RESOURCES = {
  konmariNetflixShow: {
    id: 'konmari-netflix',
    type: 'watch',
    vendor: 'netflix',
    title: 'Tidying Up with Marie Kondo',
    subtitle: 'Episode 1 walks through the vertical fold for clothing',
    url: 'https://www.netflix.com/title/80209394',
    imageUrl: 'https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/tvBg2x.jpg',
  },
  konmariBook: {
    id: 'konmari-book',
    type: 'read',
    vendor: 'marie_kondo',
    title: 'The Life-Changing Magic of Tidying Up',
    subtitle: 'The KonMari Method chapter on clothing',
    url: 'https://konmari.com/products/the-life-changing-magic-of-tidying-up',
    imageUrl: 'https://konmari.com/cdn/shop/files/Life-Changing-Magic-of-Tidying-Up.jpg',
  },
  konmariFoldingGuide: {
    id: 'konmari-folding',
    type: 'learn',
    vendor: 'marie_kondo',
    title: 'KonMari folding basics',
    subtitle: 'Stand folded items upright so you can see everything at a glance',
    url: 'https://konmari.com/blogs/news/how-to-fold-clothes',
  },
  homeEditNetflix: {
    id: 'home-edit-netflix',
    type: 'watch',
    vendor: 'netflix',
    title: 'Get Organized with The Home Edit',
    subtitle: 'See their edit → categorize → contain workflow in action',
    url: 'https://www.netflix.com/title/81257208',
    imageUrl: 'https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/tvBg2x.jpg',
  },
  homeEditBook: {
    id: 'home-edit-book',
    type: 'read',
    vendor: 'home_edit',
    title: 'The Home Edit Life',
    subtitle: 'Room-by-room guides and labeling ideas',
    url: 'https://thehomeedit.com/products/the-home-edit-life',
  },
  homeEditRainbow: {
    id: 'home-edit-rainbow',
    type: 'learn',
    vendor: 'home_edit',
    title: 'The ROYGBIV method',
    subtitle: 'Organize by color so categories stay visible at a glance',
    url: 'https://thehomeedit.com/blogs/news/the-home-edit-roygbiv-method',
  },
  homeEditLabels: {
    id: 'home-edit-labels',
    type: 'learn',
    vendor: 'home_edit',
    title: 'Labeling your zones',
    subtitle: 'Clear labels help every household member put things back',
    url: 'https://thehomeedit.com/blogs/news/how-to-label-everything',
  },
  containerStoreMeasure: {
    id: 'cs-measure',
    type: 'learn',
    vendor: 'container_store',
    title: 'Measure before you contain',
    subtitle: "Container Store's golden rule for drawers and shelves",
    url: 'https://www.containerstore.com/tip/measuring',
  },
  containerStoreDrawerGuide: {
    id: 'cs-drawer-guide',
    type: 'learn',
    vendor: 'container_store',
    title: 'Drawer organizer buying guide',
    subtitle: 'Match divider height and depth to your drawer',
    url: 'https://www.containerstore.com/s/kitchen/drawer-organizers/12d',
  },
} as const satisfies Record<string, OIResourceLink>;

export const OI_PRODUCTS = {
  linusDrawerOrganizer: {
    id: 'cs-linus-drawer',
    name: 'Linus Drawer Organizer',
    description: 'Modular bins that line a drawer edge-to-edge — ideal when many small items share one space.',
    imageUrl:
      'https://images.containerstore.com/catalogimages/369970/10035689_11012019_01.jpg',
    shopUrl:
      'https://www.containerstore.com/s/kitchen/linus-pantry-drawer-organizers/12d?productId=10035689',
    vendor: 'container_store',
    fitNote: 'Measure drawer depth first; trimmable widths available',
  },
  bambooDrawerDividers: {
    id: 'amz-bamboo-dividers',
    name: 'Expandable Bamboo Drawer Dividers',
    description: 'Adjustable dividers for deep drawers — separates categories without fixed compartments.',
    imageUrl: 'https://m.media-amazon.com/images/I/81WqJ+rGqSL._AC_SL1500_.jpg',
    shopUrl: 'https://www.amazon.com/s?k=expandable+bamboo+drawer+dividers',
    vendor: 'amazon',
    fitNote: 'Works in 17″–22″ deep drawers',
  },
  interDesignDrawerBin: {
    id: 'amz-drawer-bin-set',
    name: 'Clear Drawer Organizer Bin Set',
    description: 'Nested clear bins for utensils, office supplies, or bathroom items.',
    imageUrl: 'https://m.media-amazon.com/images/I/71qHqV+6tSL._AC_SL1500_.jpg',
    shopUrl: 'https://www.amazon.com/s?k=clear+drawer+organizer+bins+set',
    vendor: 'amazon',
    fitNote: 'Mix sizes to fit around existing drawer hardware',
  },
  shelfRiser: {
    id: 'cs-shelf-riser',
    name: 'Cabinet Shelf Riser',
    description: 'Doubles vertical shelf space — great when items stack and hide each other.',
    imageUrl:
      'https://images.containerstore.com/catalogimages/369970/10006712_10102019_01.jpg',
    shopUrl:
      'https://www.containerstore.com/s/closet/shelf-dividers-risers/12d?productId=10006712',
    vendor: 'container_store',
    fitNote: 'Choose width to match cabinet interior',
  },
  clearShoeBox: {
    id: 'cs-clear-box',
    name: 'Our Clear Shoe Box',
    description: 'Stackable clear boxes for accessories, craft supplies, or shelf-contained categories.',
    imageUrl:
      'https://images.containerstore.com/catalogimages/369970/10006710_10102019_01.jpg',
    shopUrl:
      'https://www.containerstore.com/s/closet/shoe-storage/12d?productId=10006710',
    vendor: 'container_store',
    fitNote: 'Uniform boxes keep shelves visually calm',
  },
  cableBox: {
    id: 'cs-cable-box',
    name: 'Cable Management Box',
    description: 'Hides power strips and adapter clutter for a single tech zone.',
    imageUrl:
      'https://images.containerstore.com/catalogimages/369970/10051951_11012019_01.jpg',
    shopUrl:
      'https://www.containerstore.com/s/office/cable-management/12d?productId=10051951',
    vendor: 'container_store',
    fitNote: 'Ventilated lid for chargers that run warm',
  },
  velvetHangers: {
    id: 'cs-velvet-hangers',
    name: 'Slim Velvet Hangers',
    description: 'Thin profile hangers fit more in a closet rod and keep straps from slipping.',
    imageUrl:
      'https://images.containerstore.com/catalogimages/369970/10006719_10102019_01.jpg',
    shopUrl:
      'https://www.containerstore.com/s/closet/hangers/12d?productId=10006719',
    vendor: 'container_store',
    fitNote: 'Switch all at once so rod height stays even',
  },
  pantryBin: {
    id: 'cs-pantry-bin',
    name: 'Pantry Bin & Label Set',
    description: 'Grouped bins for snacks, baking, or cleaning refills under a sink.',
    imageUrl:
      'https://images.containerstore.com/catalogimages/369970/10035689_11012019_01.jpg',
    shopUrl: 'https://www.containerstore.com/s/kitchen/food-storage/12d',
    vendor: 'container_store',
    fitNote: 'Label fronts facing out, Home Edit style',
  },
  cleaningCaddy: {
    id: 'amz-cleaning-caddy',
    name: 'Portable Cleaning Caddy',
    description: 'Carry supplies room to room instead of duplicating bottles everywhere.',
    imageUrl: 'https://m.media-amazon.com/images/I/71YdGfWjJSL._AC_SL1500_.jpg',
    shopUrl: 'https://www.amazon.com/s?k=cleaning+caddy+organizer',
    vendor: 'amazon',
    fitNote: 'One caddy per floor reduces scatter',
  },
  labelMaker: {
    id: 'amz-label-maker',
    name: 'Handheld Label Maker',
    description: 'Consistent labels on bins and shelves so everyone knows where things live.',
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aB0aL._AC_SL1500_.jpg',
    shopUrl: 'https://www.amazon.com/s?k=brother+label+maker',
    vendor: 'amazon',
    fitNote: 'Match label width to bin face size',
  },
} as const satisfies Record<string, OIProductPick>;

export function pickResources(...keys: (keyof typeof OI_RESOURCES)[]): OIResourceLink[] {
  return keys.map((k) => ({ ...OI_RESOURCES[k] }));
}

export function pickProducts(...keys: (keyof typeof OI_PRODUCTS)[]): OIProductPick[] {
  return keys.map((k) => ({ ...OI_PRODUCTS[k] }));
}

export function productsForStorageArea(
  type: StorageAreaType,
  categories: ItemCategory[],
  itemCount: number
): OIProductPick[] {
  const cats = new Set(categories);

  if (type === 'drawer' || type === 'desk') {
    if (cats.has('office') || cats.has('electronics')) {
      return pickProducts('linusDrawerOrganizer', 'cableBox', 'interDesignDrawerBin');
    }
    if (cats.has('kitchen')) {
      return pickProducts('linusDrawerOrganizer', 'bambooDrawerDividers');
    }
    return pickProducts('linusDrawerOrganizer', 'bambooDrawerDividers', 'interDesignDrawerBin');
  }

  if (type === 'shelf' || type === 'cabinet') {
    if (itemCount >= 8) {
      return pickProducts('shelfRiser', 'clearShoeBox');
    }
    if (cats.has('kitchen') || cats.has('cleaning')) {
      return pickProducts('pantryBin', 'shelfRiser');
    }
    return pickProducts('shelfRiser', 'clearShoeBox');
  }

  if (type === 'closet' || type === 'dresser') {
    if (cats.has('clothing')) {
      return pickProducts('velvetHangers', 'clearShoeBox');
    }
    return pickProducts('clearShoeBox', 'velvetHangers');
  }

  if (type === 'bin') {
    return pickProducts('clearShoeBox', 'pantryBin');
  }

  return pickProducts('clearShoeBox', 'bambooDrawerDividers');
}
