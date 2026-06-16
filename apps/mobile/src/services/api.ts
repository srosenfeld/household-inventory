import { API_BASE_URL } from '../config';
import { getAccessToken } from './auth-token';
import type {
  DraftItem,
  Household,
  Item,
  Room,
  SearchResponse,
  StorageArea,
  User,
} from '@household-inventory/shared';

async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra ?? {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await authHeaders(options.headers as Record<string, string> | undefined);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

async function uploadPhoto(uri: string): Promise<string> {
  const token = await getAccessToken();
  const formData = new FormData();
  formData.append('photo', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Photo upload failed');
  }

  const data = (await response.json()) as { photoUrl: string };
  return data.photoUrl;
}

export const api = {
  getProfile: () => request<User>('/auth/me'),
  updateProfile: (data: { firstName?: string; lastName?: string; profilePictureUrl?: string | null }) =>
    request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  uploadPhoto,

  getHouseholds: () => request<Household[]>('/households'),
  createHousehold: (name: string) =>
    request<Household>('/households', { method: 'POST', body: JSON.stringify({ name }) }),
  getHousehold: (id: string) => request<Household>(`/households/${id}`),

  getRooms: (householdId: string) => request<Room[]>(`/rooms?householdId=${householdId}`),
  createRoom: async (data: { householdId: string; name: string; photoUri?: string }) => {
    const photoUrl = data.photoUri ? await uploadPhoto(data.photoUri) : undefined;
    return request<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ householdId: data.householdId, name: data.name, photoUrl }),
    });
  },
  getRoom: (id: string) => request<Room>(`/rooms/${id}`),
  updateRoom: async (id: string, data: { name?: string; photoUri?: string; layoutMetadata?: Record<string, unknown> | null }) => {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.layoutMetadata !== undefined) payload.layoutMetadata = data.layoutMetadata;
    if (data.photoUri) payload.photoUrl = await uploadPhoto(data.photoUri);
    return request<Room>(`/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  suggestRoomNames: (roomId: string, context?: string) =>
    request<{ suggestions: Array<{ name: string; confidence: number }> }>(
      `/rooms/${roomId}/suggest-names`,
      { method: 'POST', body: JSON.stringify({ context }) }
    ),

  getStorageAreas: (roomId: string) =>
    request<StorageArea[]>(`/rooms/${roomId}/storage-areas`),
  createStorageArea: (roomId: string, data: Omit<StorageArea, 'id' | 'roomId' | 'createdAt' | 'updatedAt'>) =>
    request<StorageArea>(`/rooms/${roomId}/storage-areas`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStorageArea: (id: string, data: Partial<StorageArea>) =>
    request<StorageArea>(`/storage-areas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteStorageArea: (id: string) =>
    request<{ success: boolean }>(`/storage-areas/${id}`, { method: 'DELETE' }),
  suggestStorageAreaNames: (id: string, type?: string, context?: string) =>
    request<{ suggestions: Array<{ name: string; confidence: number }> }>(
      `/storage-areas/${id}/suggest-names`,
      { method: 'POST', body: JSON.stringify({ type, context }) }
    ),

  getItems: (storageAreaId: string) =>
    request<Item[]>(`/storage-areas/${storageAreaId}/items`),
  getRecentItems: (householdId: string) =>
    request<Item[]>(`/items?householdId=${householdId}`),
  getItem: (id: string) => request<Item>(`/items/${id}`),
  createItem: (data: {
    storageAreaId: string;
    name: string;
    description?: string;
    category: string;
    quantity?: number;
  }) => request<Item>('/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: string, data: Partial<Item>) =>
    request<Item>(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteItem: (id: string) =>
    request<{ success: boolean }>(`/items/${id}`, { method: 'DELETE' }),

  scanStorageArea: async (storageAreaId: string, uri: string): Promise<{ scanJobId: string; items: DraftItem[] }> => {
    const token = await getAccessToken();
    const formData = new FormData();
    formData.append('photo', {
      uri,
      name: 'scan.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    const response = await fetch(`${API_BASE_URL}/storage-areas/${storageAreaId}/scan`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error ?? 'Scan failed');
    }

    return response.json();
  },

  saveScanItems: (scanJobId: string, items: DraftItem[]) =>
    request<{ items: Item[] }>('/scan/save', {
      method: 'POST',
      body: JSON.stringify({
        scanJobId,
        items: items.map((item) => ({
          tempId: item.tempId,
          name: item.name,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          aiMetadata: {
            confidence: item.confidence,
            attributes: item.attributes,
          },
        })),
      }),
    }),

  search: (householdId: string, query: string) =>
    request<SearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify({ householdId, query }),
    }),
};
