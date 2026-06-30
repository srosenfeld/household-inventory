import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import type { ItemDetailScreenProps } from '../navigation/types';
import { ITEM_CATEGORIES } from '@household-inventory/shared';
import type { Item } from '@household-inventory/shared';
import { api } from '../services/api';
import { pickImageFromLibrary } from '../services/camera';
import { resolveApiUrl } from '../config';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import { Button, Chip, Input } from '../components/ui';
import { colors, spacing, typography } from '../theme';

export function ItemDetailScreen({ navigation, route }: ItemDetailScreenProps) {
  const { itemId, item: initialItem, storageAreaName, roomName } = route.params;
  const [item, setItem] = useState<Item | null>(initialItem ?? null);
  const [name, setName] = useState(initialItem?.name ?? '');
  const [description, setDescription] = useState(initialItem?.description ?? '');
  const [quantity, setQuantity] = useState(String(initialItem?.quantity ?? 1));
  const [category, setCategory] = useState(initialItem?.category ?? 'other');
  const [photoUri, setPhotoUri] = useState<string | null>(
    initialItem?.photoUrl ? resolveApiUrl(initialItem.photoUrl) : null
  );
  const [loading, setLoading] = useState(!initialItem);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  useEffect(() => {
    if (!initialItem) {
      api.getItem(itemId).then((data) => {
        setItem(data);
        setName(data.name);
        setDescription(data.description ?? '');
        setQuantity(String(data.quantity));
        setCategory(data.category);
        setPhotoUri(data.photoUrl ? resolveApiUrl(data.photoUrl) : null);
        setLoading(false);
      });
    }
  }, [itemId, initialItem]);

  const handleChangePhoto = async () => {
    let uri: string | null;
    try {
      uri = await pickImageFromLibrary();
    } catch (err) {
      Alert.alert('Permission needed', err instanceof Error ? err.message : 'Cannot access photos');
      return;
    }
    if (!uri) return;

    setPhotoUri(uri);
    setPhotoSaving(true);
    try {
      const updated = await api.updateItem(itemId, { photoUri: uri });
      setItem(updated);
      setPhotoUri(updated.photoUrl ? resolveApiUrl(updated.photoUrl) : uri);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save photo');
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateItem(itemId, {
        name: name.trim(),
        description: description.trim() || null,
        quantity: parseInt(quantity, 10) || 1,
        category: category as Item['category'],
      });
      setItem(updated);
      Alert.alert('Saved', 'Item updated successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteItem(itemId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {roomName && storageAreaName ? (
        <Text style={styles.location}>{roomName} → {storageAreaName}</Text>
      ) : null}

      <View style={styles.photoRow}>
        <PhotoThumbnail
          uri={photoUri}
          onPress={handleChangePhoto}
          label="Item photo"
          size={96}
          loading={photoSaving}
        />
        <Text style={styles.photoHint}>Add a photo to identify this item at a glance.</Text>
      </View>

      <Text style={styles.label}>Name</Text>
      <Input value={name} onChangeText={setName} style={styles.field} />

      <Text style={styles.label}>Description</Text>
      <Input value={description} onChangeText={setDescription} multiline style={styles.field} />

      <Text style={styles.label}>Quantity</Text>
      <Input value={quantity} onChangeText={setQuantity} keyboardType="number-pad" style={styles.field} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {ITEM_CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            selected={category === cat}
            onPress={() => setCategory(cat)}
          />
        ))}
      </View>

      <Button title="Save changes" onPress={handleSave} loading={saving} style={styles.saveButton} />
      <Button title="Delete item" variant="destructive" onPress={handleDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvasSoft,
  },
  location: {
    fontSize: 14,
    color: colors.primaryDeep,
    fontWeight: '500',
    marginBottom: spacing.lg,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  photoHint: {
    flex: 1,
    ...typography.caption,
    color: colors.inkSecondary,
    lineHeight: 20,
  },
  label: {
    ...typography.label,
    color: colors.ink,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  field: {
    marginBottom: 0,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
});
