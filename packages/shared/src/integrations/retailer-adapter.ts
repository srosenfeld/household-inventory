import type { Item } from '../schemas';
import type { RetailerId } from '../constants';

export interface PriceEstimate {
  retailerId: RetailerId;
  currency: string;
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  sampleCount: number;
  productUrl?: string;
}

export interface ProductListing {
  retailerId: RetailerId;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  productUrl: string;
  condition?: string;
}

export interface ListingResult {
  retailerId: RetailerId;
  listingId: string;
  listingUrl: string;
  status: 'draft' | 'active' | 'pending';
}

export interface RetailerAdapter {
  id: RetailerId;
  estimatePrice(item: Item): Promise<PriceEstimate[]>;
  searchSimilar(item: Item): Promise<ProductListing[]>;
  createListing?(item: Item, price: number): Promise<ListingResult>;
}

export interface RetailerRegistry {
  getAdapter(id: RetailerId): RetailerAdapter | undefined;
  listAdapters(): RetailerAdapter[];
}

export function createRetailerRegistry(adapters: RetailerAdapter[]): RetailerRegistry {
  const map = new Map(adapters.map((a) => [a.id, a]));
  return {
    getAdapter: (id) => map.get(id),
    listAdapters: () => adapters,
  };
}
