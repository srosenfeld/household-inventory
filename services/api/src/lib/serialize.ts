import type { DbHousehold, DbItem, DbRoom, DbStorageArea, DbUser } from '../db/client';

export function serializeUser(row: DbUser) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePictureUrl: row.profile_picture_url,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function serializeHousehold(row: DbHousehold) {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function serializeRoom(row: DbRoom) {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    photoUrl: row.photo_url,
    layoutMetadata: row.layout_metadata,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function serializeStorageArea(row: DbStorageArea) {
  return {
    id: row.id,
    roomId: row.room_id,
    name: row.name,
    type: row.type,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    photoUrl: row.photo_url,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function serializeItem(row: DbItem) {
  return {
    id: row.id,
    storageAreaId: row.storage_area_id,
    name: row.name,
    description: row.description,
    category: row.category,
    quantity: row.quantity,
    photoUrl: row.photo_url,
    aiMetadata: row.ai_metadata,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
