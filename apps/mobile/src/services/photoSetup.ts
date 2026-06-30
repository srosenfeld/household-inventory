import type { StorageAreaType } from '@household-inventory/shared';
import type { CapturedPhoto, RoomAssignment } from '../contexts/PhotoSetupContext';
import { api } from './api';

function defaultLayout(index: number) {
  const cols = 2;
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    x: 0.05 + col * 0.48,
    y: 0.05 + row * 0.28,
    width: 0.42,
    height: 0.22,
  };
}

function defaultOrganization(photo: CapturedPhoto, index: number, isFirstInRoom: boolean) {
  if (photo.organization) return photo.organization;
  if (isFirstInRoom && index === 0) {
    return {
      role: 'room_overview' as const,
      storageAreaName: '',
      storageAreaType: 'other' as StorageAreaType,
    };
  }
  return {
    role: 'storage_area' as const,
    storageAreaName: `Storage area ${index + 1}`,
    storageAreaType: 'other' as StorageAreaType,
  };
}

export async function savePhotoSetupToHousehold(
  householdId: string,
  groups: Array<{ assignment: RoomAssignment; photos: CapturedPhoto[] }>
): Promise<{ roomId: string; roomName: string }[]> {
  const savedRooms: { roomId: string; roomName: string }[] = [];

  for (const group of groups) {
    const organized = group.photos.map((photo, index) => ({
      photo,
      org:
        photo.organization ??
        defaultOrganization(photo, index, group.photos.length === 1),
    }));

    const overview = organized.find((o) => o.org.role === 'room_overview');
    const storageAreas = organized.filter((o) => o.org.role === 'storage_area');

    let roomId: string;
    let roomName: string;

    if (group.assignment.kind === 'existing') {
      roomId = group.assignment.roomId;
      roomName = group.assignment.roomName;
      if (overview) {
        await api.updateRoom(roomId, { photoUri: overview.photo.uri });
      }
    } else {
      const room = await api.createRoom({
        householdId,
        name: group.assignment.roomName,
        photoUri: overview?.photo.uri,
      });
      roomId = room.id;
      roomName = room.name;
    }

    let areaIndex = 0;
    for (const { photo, org } of storageAreas) {
      const layout = defaultLayout(areaIndex);
      const name = org.storageAreaName.trim() || `Storage area ${areaIndex + 1}`;
      const area = await api.createStorageArea(roomId, {
        name,
        type: org.storageAreaType,
        ...layout,
        photoUrl: null,
      });
      await api.updateStorageArea(area.id, { photoUri: photo.uri });
      areaIndex += 1;
    }

    savedRooms.push({ roomId, roomName });
  }

  return savedRooms;
}
