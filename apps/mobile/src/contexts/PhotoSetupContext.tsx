import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { StorageAreaType } from '@household-inventory/shared';

export type RoomAssignment =
  | { kind: 'existing'; roomId: string; roomName: string }
  | { kind: 'new'; roomName: string };

export type PhotoOrganization = {
  role: 'room_overview' | 'storage_area';
  storageAreaName: string;
  storageAreaType: StorageAreaType;
};

export interface CapturedPhoto {
  id: string;
  uri: string;
  roomAssignment?: RoomAssignment;
  organization?: PhotoOrganization;
}

function photoId() {
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface PhotoSetupContextValue {
  photos: CapturedPhoto[];
  addPhotos: (uris: string[]) => void;
  removePhoto: (id: string) => void;
  assignPhotos: (photoIds: string[], assignment: RoomAssignment) => void;
  updatePhotoOrganization: (photoId: string, organization: PhotoOrganization) => void;
  clearSession: () => void;
  allAssigned: boolean;
  roomGroups: Array<{ key: string; roomName: string; assignment: RoomAssignment; photos: CapturedPhoto[] }>;
}

const PhotoSetupContext = createContext<PhotoSetupContextValue | null>(null);

export function PhotoSetupProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);

  const addPhotos = useCallback((uris: string[]) => {
    if (uris.length === 0) return;
    setPhotos((prev) => [
      ...prev,
      ...uris.map((uri) => ({ id: photoId(), uri })),
    ]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const assignPhotos = useCallback((photoIds: string[], assignment: RoomAssignment) => {
    const idSet = new Set(photoIds);
    setPhotos((prev) =>
      prev.map((p) => (idSet.has(p.id) ? { ...p, roomAssignment: assignment, organization: undefined } : p))
    );
  }, []);

  const updatePhotoOrganization = useCallback((photoId: string, organization: PhotoOrganization) => {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, organization } : p)));
  }, []);

  const clearSession = useCallback(() => setPhotos([]), []);

  const allAssigned = photos.length > 0 && photos.every((p) => p.roomAssignment);

  const roomGroups = useMemo(() => {
    const map = new Map<string, { key: string; roomName: string; assignment: RoomAssignment; photos: CapturedPhoto[] }>();
    for (const photo of photos) {
      if (!photo.roomAssignment) continue;
      const key =
        photo.roomAssignment.kind === 'existing'
          ? `existing:${photo.roomAssignment.roomId}`
          : `new:${photo.roomAssignment.roomName.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.photos.push(photo);
      } else {
        map.set(key, {
          key,
          roomName: photo.roomAssignment.roomName,
          assignment: photo.roomAssignment,
          photos: [photo],
        });
      }
    }
    return Array.from(map.values());
  }, [photos]);

  const value = useMemo(
    () => ({
      photos,
      addPhotos,
      removePhoto,
      assignPhotos,
      updatePhotoOrganization,
      clearSession,
      allAssigned,
      roomGroups,
    }),
    [photos, addPhotos, removePhoto, assignPhotos, updatePhotoOrganization, clearSession, allAssigned, roomGroups]
  );

  return <PhotoSetupContext.Provider value={value}>{children}</PhotoSetupContext.Provider>;
}

export function usePhotoSetup() {
  const ctx = useContext(PhotoSetupContext);
  if (!ctx) throw new Error('usePhotoSetup must be used within PhotoSetupProvider');
  return ctx;
}
