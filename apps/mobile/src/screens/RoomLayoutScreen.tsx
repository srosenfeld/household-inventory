import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { RoomLayoutScreenProps } from '../navigation/types';
import { api } from '../services/api';
import { pickImageFromLibrary } from '../services/camera';
import { LayoutCanvas, type LayoutZone } from '../components/LayoutCanvas';
import type { StorageArea } from '@household-inventory/shared';
import { resolveApiUrl } from '../config';

function tempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isPersistedId(id: string) {
  return !id.startsWith('temp-');
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

  const handlePickPhoto = async () => {
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

  const handleAddZone = async (partial: Omit<LayoutZone, 'id' | 'name'>) => {
    const id = tempId();
    const name = `${partial.type} ${zones.length + 1}`;
    const newZone: LayoutZone = { id, name, ...partial };
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a6cf7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.headerScroll}
        contentContainerStyle={styles.headerContent}
        scrollEnabled={!canvasGestureActive}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.input}
          value={roomName}
          onChangeText={setRoomName}
          onBlur={handleSaveRoomName}
          placeholder="Room name"
        />

        <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto} disabled={saving}>
          <Text style={styles.photoButtonText}>
            {photoUri ? 'Change room photo' : 'Add room photo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.canvasWrapper}>
        <LayoutCanvas
          photoUri={photoUri}
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={handleSelectZone}
          onUpdateZone={handleUpdateZone}
          onAddZone={handleAddZone}
          onGestureActiveChange={setCanvasGestureActive}
        />
      </View>

      <ScrollView
        style={styles.editorScroll}
        contentContainerStyle={styles.editorContent}
        scrollEnabled={!canvasGestureActive}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Storage areas ({zones.length})</Text>
        <Text style={styles.sectionHint}>Tap a zone on the photo or below to edit. Pinch with two fingers to resize.</Text>

        {zones.map((zone) => (
          <TouchableOpacity
            key={zone.id}
            style={[styles.zoneRow, selectedZoneId === zone.id && styles.zoneRowSelected]}
            onPress={() => handleSelectZone(zone.id)}
          >
            <View style={styles.zoneRowText}>
              <Text style={styles.zoneRowName}>{zone.name}</Text>
              <Text style={styles.zoneRowMeta}>{zone.type}</Text>
            </View>
            <TouchableOpacity
              style={styles.zoneRowOpen}
              onPress={() => handleOpenZone(zone)}
            >
              <Text style={styles.zoneRowOpenText}>Items</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {zones.length === 0 ? (
          <Text style={styles.emptyZones}>No storage areas yet. Tap "+ Add storage area" above.</Text>
        ) : null}

        {selectedZone ? (
          <View style={styles.zoneEditor}>
            <Text style={styles.zoneEditorTitle}>Edit storage area</Text>
            <TextInput
              style={styles.input}
              value={zoneName}
              onChangeText={setZoneName}
              placeholder="Storage area name"
            />
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
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  headerScroll: {
    flexGrow: 0,
  },
  headerContent: {
    padding: 16,
    paddingBottom: 8,
  },
  editorScroll: {
    flex: 1,
  },
  editorContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e8e8ef',
    marginBottom: 10,
  },
  photoButton: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  canvasWrapper: {
    height: 360,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e8ef',
  },
  zoneRowSelected: {
    borderColor: '#4a6cf7',
    backgroundColor: '#f0f4ff',
  },
  zoneRowText: {
    flex: 1,
  },
  zoneRowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  zoneRowMeta: {
    fontSize: 13,
    color: '#888',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  zoneRowOpen: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4a6cf7',
  },
  zoneRowOpenText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyZones: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 16,
  },
  zoneEditor: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e8ef',
    marginTop: 12,
  },
  zoneEditorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1a1a2e',
  },
  zoneActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
  },
  smallButtonText: {
    color: '#4a6cf7',
    fontWeight: '600',
    fontSize: 13,
  },
  primarySmall: {
    backgroundColor: '#4a6cf7',
  },
  primarySmallText: {
    color: '#fff',
  },
  dangerSmall: {
    backgroundColor: '#fdecea',
  },
  dangerSmallText: {
    color: '#e74c3c',
  },
});
