import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { ReviewItemsScreenProps } from '../navigation/types';
import type { DraftItem } from '@household-inventory/shared';
import { api } from '../services/api';

export function ReviewItemsScreen({ navigation, route }: ReviewItemsScreenProps) {
  const { storageAreaId, roomId, scanJobId, storageAreaName, roomName } = route.params;
  const [items, setItems] = useState<DraftItem[]>(route.params.draftItems);
  const [saving, setSaving] = useState(false);

  const updateItem = (tempId: string, updates: Partial<DraftItem>) => {
    setItems((prev) => prev.map((item) => (item.tempId === tempId ? { ...item, ...updates } : item)));
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleSave = async () => {
    if (items.length === 0) {
      Alert.alert('No items', 'Add at least one item or go back.');
      return;
    }

    setSaving(true);
    try {
      await api.saveScanItems(scanJobId, items);
      navigation.navigate('StorageArea', {
        storageAreaId,
        storageAreaName,
        roomId,
        roomName,
      });
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review identified items</Text>
      <Text style={styles.subtitle}>Edit names, quantities, or remove incorrect items before saving.</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.tempId}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <TextInput
                style={styles.nameInput}
                value={item.name}
                onChangeText={(text) => updateItem(item.tempId, { name: text })}
              />
              <TouchableOpacity onPress={() => removeItem(item.tempId)}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.descInput}
              value={item.description ?? ''}
              onChangeText={(text) => updateItem(item.tempId, { description: text })}
              placeholder="Description"
              multiline
            />

            <View style={styles.row}>
              <Text style={styles.label}>Qty:</Text>
              <TextInput
                style={styles.qtyInput}
                value={String(item.quantity)}
                keyboardType="number-pad"
                onChangeText={(text) => {
                  const qty = parseInt(text, 10);
                  if (!isNaN(qty) && qty >= 1) updateItem(item.tempId, { quantity: qty });
                }}
              />
              <Text style={styles.label}>Category:</Text>
              <Text style={styles.category}>{item.category}</Text>
            </View>

            {item.confidence !== undefined && item.confidence < 0.8 ? (
              <Text style={styles.lowConfidence}>
                Low confidence ({Math.round(item.confidence * 100)}%) — please verify
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No items detected. Go back and try another photo.</Text>
        }
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save {items.length} item(s) to inventory</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8ef',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ef',
    paddingVertical: 4,
  },
  remove: {
    color: '#e74c3c',
    marginLeft: 10,
    fontWeight: '600',
  },
  descInput: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: '#888',
  },
  qtyInput: {
    width: 40,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ef',
    textAlign: 'center',
  },
  category: {
    fontSize: 13,
    color: '#4a6cf7',
    textTransform: 'capitalize',
  },
  lowConfidence: {
    fontSize: 12,
    color: '#e67e22',
    marginTop: 8,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  saveButton: {
    backgroundColor: '#4a6cf7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
