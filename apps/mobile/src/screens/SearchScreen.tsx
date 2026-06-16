import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { SearchScreenProps } from '../navigation/types';
import type { SearchResponse } from '@household-inventory/shared';
import { api } from '../services/api';
import { SearchResultCard } from '../components/SearchResultCard';

export function SearchScreen({ navigation, route }: SearchScreenProps) {
  const { householdId } = route.params;
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await api.search(householdId, query.trim());
      setResult(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Find an item</Text>
      <Text style={styles.subtitle}>Ask where something is stored in your home</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder='e.g. "Where is my hammer?"'
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {result ? (
        <View style={styles.resultSection}>
          <View style={styles.messageBox}>
            <Text style={styles.message}>{result.message}</Text>
          </View>

          <FlatList
            data={result.matches}
            keyExtractor={(item) => item.itemId}
            renderItem={({ item }) => (
              <SearchResultCard
                match={item}
                onPress={() =>
                  navigation.navigate('ItemDetail', {
                    itemId: item.itemId,
                    storageAreaName: item.storageAreaName,
                    roomName: item.roomName,
                  })
                }
              />
            )}
            ListEmptyComponent={null}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
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
    fontSize: 15,
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e8e8ef',
  },
  searchButton: {
    backgroundColor: '#4a6cf7',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultSection: {
    flex: 1,
    marginTop: 20,
  },
  messageBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#1a1a2e',
    lineHeight: 24,
  },
});
