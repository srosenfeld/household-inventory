import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { HomeScreenProps } from '../navigation/types';
import { api } from '../services/api';
import { ItemCard } from '../components/ItemCard';
import type { Item } from '@household-inventory/shared';

export function HomeScreen({ navigation, route }: HomeScreenProps) {
  const { householdId, householdName } = route.params;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const data = await api.getRecentItems(householdId);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{householdName}</Text>
          <Text style={styles.subtitle}>Your household inventory</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileButtonText}>Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RoomList', { householdId, householdName })}
        >
          <Text style={styles.actionButtonText}>Rooms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.searchButton]}
          onPress={() => navigation.navigate('Search', { householdId })}
        >
          <Text style={styles.actionButtonText}>Find item</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent items</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#4a6cf7" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadItems(); }} />
          }
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => navigation.navigate('ItemDetail', { itemId: item.id, item })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No items yet. Add a room and scan a storage area to get started.</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  profileButton: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#4a6cf7',
    fontWeight: '600',
    fontSize: 13,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4a6cf7',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#1a1a2e',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  },
});
