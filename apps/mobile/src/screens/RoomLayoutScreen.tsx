import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { RoomLayoutScreenProps } from '../navigation/types';
import { STORAGE_AREA_TYPES } from '@household-inventory/shared';
import { api } from '../services/api';
import { pickImageFromLibrary } from '../services/camera';
import { LayoutCanvas, type LayoutZone } from '../components/LayoutCanvas';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import type { StorageArea } from '@household-inventory/shared';
import { resolveApiUrl } from '../config';
import { Button, Input } from '../components/ui';
import { colors, spacing, typography } from '../theme';

function tempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isPersistedId(id: string) {
  return !id.startsWith('temp-');
}

function zonePhotoUri(zone: LayoutZone): string | null {
  if (!zone.photoUrl) return null;
  return resolveApiUrl(zone.photoUrl);
}

export function RoomLayoutScreen({ navigation, route }: RoomLayoutScreenProps) {
  const { roomId, roomName: initialRoomName } = route.params;
  const [roomName, setRoomName] = useState(initialRoomName);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [zones, setZones] = useState<LayoutZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zonePhotoSaving, setZonePhotoSaving] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [canvasGestureActive, setCanvasGestureActive] = useState(false);

  const loadRoom = useCallback(async () => {
    try {
      const room = await api.getRoom(roomId);
      setRoomName(room.name);
      if (room.photoUrl) {
        setPhotoUri(resolveApiUrl(room.photoUrl));
      }
      const areas = await api.getStorageAreas(roomId);
      const mapped = areas.map((a: StorageArea) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        x: a.x,
        y: a.y,
        width: a.width,
        height: a.height,
        photoUrl: a.photoUrl,
      }));
      setZones(mapped);
      setSelectedZoneId((current) => {
        if (current && mapped.some((z) => z.id === current)) return current;
        return null;
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useFocusEffect(
    useCallback(() => {
      loadRoom();
    }, [loadRoom])
  );

  useEffect(() => {
    if (!selectedZoneId) return;
    const zone = zones.find((z) => z.id === selectedZoneId);
    if (zone) setZoneName(zone.name);
  }, [selectedZoneId, zones]);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const handleSelectZone = useCallback(
    (id: string | null) => {
      setSelectedZoneId(id);
      if (id) {
        const zone = zones.find((z) => z.id === id);
        setZoneName(zone?.name ?? '');
      } else {
        setZoneName('');
      }
    },
    [zones]
  );

  const handlePickRoomPhoto = async () => {
    let uri: string | null;
    try {
      uri = await pickImageFromLibrary();
    } catch (err) {
      Alert.alert('Permission needed', err instanceof Error ? err.message : 'Cannot access photos');
      return;
    }
    if (!uri) return;

    setPhotoUri(uri);
    setSaving(true);
    try {
      await api.updateRoom(roomId, { name: roomName, photoUri: uri });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save photo');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRoomName = async () => {
    try {
      await api.updateRoom(roomId, { name: roomName });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const promptAddZone = () => {
    Alert.alert('Add storage area', 'Choose a type', [
      ...STORAGE_AREA_TYPES.map((type) => ({
        text: type,
        onPress: () => handleAddZone({ type, x: 0.1, y: 0.1, width: 0.3, height: 0.2 }),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAddZone = async (partial: Omit<LayoutZone, 'id' | 'name' | 'photoUrl'>) => {
    const id = tempId();
    const name = `${partial.type} ${zones.length + 1}`;
    const newZone: LayoutZone = { id, name, photoUrl: null, ...partial };
    setZones((prev) => [...prev, newZone]);
    setSelectedZoneId(id);
    setZoneName(name);

    try {
      const saved = await api.createStorageArea(roomId, {
        name,
        type: partial.type,
        x: partial.x,
        y: partial.y,
        width: partial.width,
        height: partial.height,
        photoUrl: null,
      });
      setZones((prev) => prev.map((z) => (z.id === id ? { ...z, id: saved.id } : z)));
      setSelectedZoneId((current) => (current === id ? saved.id : current));
    } catch (err) {
      setZones((prev) => prev.filter((z) => z.id !== id));
      if (selectedZoneId === id) handleSelectZone(null);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create zone');
    }
  };

  const handleUpdateZone = async (id: string, updates: Partial<LayoutZone>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...updates } : z)));
    if (!isPersistedId(id)) return;

    try {
      await api.updateStorageArea(id, updates);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update storage area');
      loadRoom();
    }
  };

  const handleZonePhoto = async (zoneId: string) => {
    if (!isPersistedId(zoneId)) {
      Alert.alert('Saving…', 'Wait for the storage area to finish saving.');
      return;
    }

    let uri: string | null;
    try {
      uri = await pickImageFromLibrary();
    } catch (err) {
      Alert.alert('Permission needed', err instanceof Error ? err.message : 'Cannot access photos');
      return;
    }
    if (!uri) return;

    setZonePhotoSaving(true);
    try {
      const updated = await api.updateStorageArea(zoneId, { photoUri: uri });
      setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, photoUrl: updated.photoUrl } : z)));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save photo');
    } finally {
      setZonePhotoSaving(false);
    }
  };

  const handleSaveZoneName = async () => {
    if (!selectedZoneId || !zoneName.trim()) return;
    await handleUpdateZone(selectedZoneId, { name: zoneName.trim() });
  };

  const handleDeleteZone = () => {
    if (!selectedZoneId || !isPersistedId(selectedZoneId)) return;

    Alert.alert('Delete storage area', `Remove "${selectedZone?.name}" and all its items?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteStorageArea(selectedZoneId);
            setZones((prev) => prev.filter((z) => z.id !== selectedZoneId));
            handleSelectZone(null);
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete storage area');
          }
        },
      },
    ]);
  };

  const handleSuggestNames = async () => {
    if (!selectedZoneId || !isPersistedId(selectedZoneId)) return;
    try {
      const { suggestions } = await api.suggestStorageAreaNames(
        selectedZoneId,
        selectedZone?.type,
        `Storage area in ${roomName}`
      );
      if (suggestions.length > 0) {
        Alert.alert(
          'Suggested names',
          undefined,
          [
            ...suggestions.map((s) => ({
              text: s.name,
              onPress: () => {
                setZoneName(s.name);
                handleUpdateZone(selectedZoneId, { name: s.name });
              },
            })),
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to get suggestions');
    }
  };

  const handleOpenZone = (zone: LayoutZone) => {
    if (!isPersistedId(zone.id)) {
      Alert.alert('Saving…', 'Wait a moment for the storage area to finish saving.');
      return;
    }
    navigation.navigate('StorageArea', {
      storageAreaId: zone.id,
      storageAreaName: zone.name,
      roomId,
      roomName,
    });
  };

  const renderZoneEditor = () => {
    if (!selectedZone) return null;

    return (
      <View style={styles.zoneEditor}>
        <Text style={styles.zoneEditorTitle}>Edit storage area</Text>
        <View style={styles.zoneEditorRow}>
          <PhotoThumbnail
            uri={zonePhotoUri(selectedZone)}
            onPress={() => handleZonePhoto(selectedZone.id)}
            label="Area photo"
            loading={zonePhotoSaving}
          />
          <View style={styles.zoneEditorFields}>
            <TextInput
              style={styles.zoneNameInput}
              value={zoneName}
              onChangeText={setZoneName}
              placeholder="Storage area name"
              placeholderTextColor={colors.inkMuted}
            />
            <Text style={styles.zoneTypeLabel}>{selectedZone.type}</Text>
          </View>
        </View>
        <View style={styles.zoneActions}>
          <TouchableOpacity style={styles.smallButton} onPress={handleSaveZoneName}>
            <Text style={styles.smallButtonText}>Save name</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={handleSuggestNames}>
            <Text style={styles.smallButtonText}>Suggest names</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.primarySmall]}
            onPress={() => handleOpenZone(selectedZone)}
          >
            <Text style={[styles.smallButtonText, styles.primarySmallText]}>Open & inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallButton, styles.dangerSmall]} onPress={handleDeleteZone}>
            <Text style={[styles.smallButtonText, styles.dangerSmallText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderListHeader = () => (
    <View>
      <View style={styles.roomHeader}>
        <Input
          style={styles.roomNameInput}
          value={roomName}
          onChangeText={setRoomName}
          onBlur={handleSaveRoomName}
          placeholder="Room name"
        />
        <PhotoThumbnail
          uri={photoUri}
          onPress={handlePickRoomPhoto}
          label="Room photo"
          size={64}
          loading={saving}
        />
      </View>

      <TouchableOpacity
        style={styles.mapToggle}
        onPress={() => setMapExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: mapExpanded }}
      >
        <Text style={styles.mapToggleText}>
          {mapExpanded ? 'Hide room map' : 'Show room map'}
        </Text>
        <Text style={styles.mapToggleHint}>
          {photoUri ? 'Tap zones on the photo to select' : 'Add a room photo to place storage areas'}
        </Text>
      </TouchableOpacity>

      {mapExpanded ? (
        <View style={styles.mapSection}>
          {!photoUri ? (
            <Button
              title="Add room photo"
              variant="secondary"
              onPress={handlePickRoomPhoto}
              disabled={saving}
              style={styles.mapAddPhotoBtn}
            />
          ) : null}
          <LayoutCanvas
            photoUri={photoUri}
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={handleSelectZone}
            onUpdateZone={handleUpdateZone}
            onAddZone={handleAddZone}
            onGestureActiveChange={setCanvasGestureActive}
            showAddButton={false}
            compact
          />
        </View>
      ) : null}

      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Storage areas ({zones.length})</Text>
        <Button title="+ Add" onPress={promptAddZone} style={styles.addZoneBtn} />
      </View>
      <Text style={styles.sectionHint}>
        Select a storage area to edit, add a photo, or open its inventory.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={zones}
        keyExtractor={(zone) => zone.id}
        scrollEnabled={!canvasGestureActive}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderZoneEditor}
        extraData={{ mapExpanded, selectedZoneId, zonePhotoSaving, zones, photoUri, saving }}
        ListEmptyComponent={
          <Text style={styles.emptyZones}>No storage areas yet. Tap "+ Add" above.</Text>
        }
        renderItem={({ item: zone }) => (
          <View
            style={[styles.zoneRow, selectedZoneId === zone.id && styles.zoneRowSelected]}
          >
            <PhotoThumbnail
              uri={zonePhotoUri(zone)}
              onPress={() => {
                handleSelectZone(zone.id);
                handleZonePhoto(zone.id);
              }}
              label="Photo"
              size={48}
              showLabel={false}
              loading={zonePhotoSaving && selectedZoneId === zone.id}
            />
            <TouchableOpacity
              style={styles.zoneRowText}
              onPress={() => handleSelectZone(zone.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.zoneRowName} numberOfLines={1}>
                {zone.name}
              </Text>
              <Text style={styles.zoneRowMeta} numberOfLines={1}>
                {zone.type}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoneRowOpen}
              onPress={() => handleOpenZone(zone)}
              hitSlop={4}
            >
              <Text style={styles.zoneRowOpenText}>Items</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 40,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvasSoft,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  roomNameInput: {
    flex: 1,
    marginBottom: 0,
  },
  mapToggle: {
    backgroundColor: colors.canvas,
    borderRadius: spacing.buttonRadius,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.md,
  },
  mapToggleText: {
    ...typography.bodyMedium,
    color: colors.primaryDeep,
    fontWeight: '600',
  },
  mapToggleHint: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  mapSection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
    width: '100%',
    overflow: 'hidden',
  },
  mapAddPhotoBtn: {
    marginBottom: spacing.xs,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  addZoneBtn: {
    paddingHorizontal: spacing.md,
    minHeight: 40,
    paddingVertical: spacing.sm,
    flexShrink: 0,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    flex: 1,
    flexShrink: 1,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.inkSecondary,
    marginBottom: spacing.md,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderRadius: spacing.buttonRadius,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  zoneRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  zoneRowText: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  zoneRowName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  zoneRowMeta: {
    fontSize: 13,
    color: colors.inkMuted,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  zoneRowOpen: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    minWidth: 72,
  },
  zoneRowOpenText: {
    color: colors.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyZones: {
    color: colors.inkMuted,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  zoneEditor: {
    backgroundColor: colors.canvas,
    borderRadius: spacing.cardRadius,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginTop: spacing.md,
  },
  zoneEditorTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.ink,
  },
  zoneEditorRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  zoneEditorFields: {
    flex: 1,
  },
  zoneNameInput: {
    backgroundColor: colors.canvasSoft,
    borderRadius: spacing.inputRadius,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.xs,
    color: colors.ink,
  },
  zoneTypeLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    textTransform: 'capitalize',
  },
  zoneActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  smallButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.buttonRadius,
    backgroundColor: colors.primarySoft,
  },
  smallButtonText: {
    color: colors.primaryDeep,
    fontWeight: '600',
    fontSize: 13,
  },
  primarySmall: {
    backgroundColor: colors.primary,
  },
  primarySmallText: {
    color: colors.ink,
  },
  dangerSmall: {
    backgroundColor: colors.destructiveSoft,
  },
  dangerSmallText: {
    color: colors.destructive,
  },
});
