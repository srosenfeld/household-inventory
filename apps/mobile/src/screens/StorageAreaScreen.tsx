import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, FlatList, ActivityIndicator, Alert, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StorageAreaScreenProps } from '../navigation/types';
import { api } from '../services/api';
import { pickImageFromLibrary } from '../services/camera';
import { resolveApiUrl } from '../config';
import { ItemCard } from '../components/ItemCard';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import { Button, ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import type { Item } from '@household-inventory/shared';

export function StorageAreaScreen({ navigation, route }: StorageAreaScreenProps) {
  const { storageAreaId, storageAreaName, roomId, roomName } = route.params;
  const [items, setItems] = useState<Item[]>([]);
  const [areaPhotoUri, setAreaPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoSaving, setPhotoSaving] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const [data, area] = await Promise.all([
        api.getItems(storageAreaId),
        api.getStorageArea(storageAreaId),
      ]);
      setItems(data);
      setAreaPhotoUri(area.photoUrl ? resolveApiUrl(area.photoUrl) : null);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [storageAreaId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadItems();
    }, [loadItems])
  );

  const handleAreaPhoto = async () => {
    let uri: string | null;
    try {
      uri = await pickImageFromLibrary();
    } catch (err) {
      Alert.alert('Permission needed', err instanceof Error ? err.message : 'Cannot access photos');
      return;
    }
    if (!uri) return;

    setPhotoSaving(true);
    try {
      const updated = await api.updateStorageArea(storageAreaId, { photoUri: uri });
      setAreaPhotoUri(updated.photoUrl ? resolveApiUrl(updated.photoUrl) : uri);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save photo');
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const item = await api.createItem({
        storageAreaId,
        name: 'New item',
        category: 'other',
        quantity: 1,
      });
      navigation.navigate('ItemDetail', {
        itemId: item.id,
        item,
        storageAreaName,
        roomName,
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  const handleDeleteItem = (item: Item) => {
    Alert.alert('Delete item', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteItem(item.id);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const listHeader = (
    <View>
      <Text style={styles.location}>{roomName} → {storageAreaName}</Text>

      <View style={styles.areaPhotoRow}>
        <PhotoThumbnail
          uri={areaPhotoUri}
          onPress={handleAreaPhoto}
          label="Area photo"
          size={80}
          loading={photoSaving}
        />
        <Text style={styles.areaPhotoHint}>
          Photo of this shelf, bin, or drawer — separate from the room layout map.
        </Text>
      </View>

      <Button
        title="Photo scan contents"
        onPress={() =>
          navigation.navigate('Capture', { storageAreaId, storageAreaName, roomId, roomName })
        }
        style={styles.scanButton}
      />
      <Button title="+ Add item manually" variant="secondary" onPress={handleAddItem} />

      <Text style={styles.sectionTitle}>Items ({items.length})</Text>
      <Text style={styles.sectionHint}>Tap an item to edit. Long-press to delete.</Text>
    </View>
  );

  return (
    <ScreenContainer padded={false}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              showConfidence
              onPress={() =>
                navigation.navigate('ItemDetail', {
                  itemId: item.id,
                  item,
                  storageAreaName,
                  roomName,
                })
              }
              onLongPress={() => handleDeleteItem(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No items in this storage area yet.</Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.screenPadding,
    paddingBottom: 40,
  },
  location: {
    fontSize: 14,
    color: colors.primaryDeep,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  areaPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  areaPhotoHint: {
    flex: 1,
    ...typography.caption,
    color: colors.inkSecondary,
    lineHeight: 20,
  },
  scanButton: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.inkSecondary,
    marginBottom: spacing.md,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  empty: {
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
