import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { ItemDetailScreenProps } from '../navigation/types';
import { ITEM_CATEGORIES } from '@household-inventory/shared';
import type { Item } from '@household-inventory/shared';
import { api } from '../services/api';

export function ItemDetailScreen({ navigation, route }: ItemDetailScreenProps) {
  const { itemId, item: initialItem, storageAreaName, roomName } = route.params;
  const [item, setItem] = useState<Item | null>(initialItem ?? null);
  const [name, setName] = useState(initialItem?.name ?? '');
  const [description, setDescription] = useState(initialItem?.description ?? '');
  const [quantity, setQuantity] = useState(String(initialItem?.quantity ?? 1));
  const [category, setCategory] = useState(initialItem?.category ?? 'other');
  const [loading, setLoading] = useState(!initialItem);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialItem) {
      api.getItem(itemId).then((data) => {
        setItem(data);
        setName(data.name);
        setDescription(data.description ?? '');
        setQuantity(String(data.quantity));
        setCategory(data.category);
        setLoading(false);
      });
    }
  }, [itemId, initialItem]);

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
        <ActivityIndicator size="large" color="#4a6cf7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {roomName && storageAreaName ? (
        <Text style={styles.location}>{roomName} → {storageAreaName}</Text>
      ) : null}

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Quantity</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {ITEM_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  location: {
    fontSize: 14,
    color: '#4a6cf7',
    fontWeight: '500',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e8e8ef',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
  },
  categoryChipActive: {
    backgroundColor: '#4a6cf7',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#4a6cf7',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#4a6cf7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
});
