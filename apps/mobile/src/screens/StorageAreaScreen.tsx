import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StorageAreaScreenProps } from '../navigation/types';
import { api } from '../services/api';
import { ItemCard } from '../components/ItemCard';
import type { Item } from '@household-inventory/shared';

export function StorageAreaScreen({ navigation, route }: StorageAreaScreenProps) {
  const { storageAreaId, storageAreaName, roomId, roomName } = route.params;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    try {
      const data = await api.getItems(storageAreaId);
      setItems(data);
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

  return (
    <View style={styles.container}>
      <Text style={styles.location}>{roomName} → {storageAreaName}</Text>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() =>
          navigation.navigate('Capture', { storageAreaId, storageAreaName, roomId, roomName })
        }
      >
        <Text style={styles.scanButtonText}>Photo scan contents</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
        <Text style={styles.addButtonText}>+ Add item manually</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Items ({items.length})</Text>
      <Text style={styles.sectionHint}>Tap an item to edit. Long-press to delete.</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#4a6cf7" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    padding: 20,
  },
  location: {
    fontSize: 14,
    color: '#4a6cf7',
    fontWeight: '500',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#4a6cf7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a6cf7',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#4a6cf7',
    fontWeight: '600',
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
  loader: {
    marginTop: 40,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});
