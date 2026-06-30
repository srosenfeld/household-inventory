import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { SearchScreenProps } from '../navigation/types';
import type { SearchResponse } from '@household-inventory/shared';
import { useHousehold } from '../contexts/HouseholdContext';
import { api } from '../services/api';
import { SearchResultCard } from '../components/SearchResultCard';
import { Button, Input, ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';

export function SearchScreen({ navigation }: SearchScreenProps) {
  const { householdId } = useHousehold();
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
    <ScreenContainer padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.subtitle}>Ask where something is stored in your home</Text>

          <View style={styles.searchRow}>
            <Input
              style={styles.searchInput}
              placeholder='e.g. "Where is my hammer?"'
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <Button
              title="Search"
              onPress={handleSearch}
              loading={loading}
              style={styles.searchBtn}
            />
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
              />
            </View>
          ) : (
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>Search tips</Text>
              <Text style={styles.tipsText}>
                Try natural questions like &quot;Where are the batteries?&quot; or search by item name.
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginBottom: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchBtn: {
    minWidth: 96,
    paddingHorizontal: spacing.lg,
  },
  resultSection: {
    flex: 1,
    marginTop: spacing.lg,
  },
  messageBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: spacing.cardRadius,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  message: {
    fontSize: 16,
    color: colors.ink,
    lineHeight: 24,
  },
  tipsBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: spacing.cardRadius,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  tipsTitle: {
    ...typography.label,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  tipsText: {
    ...typography.body,
    color: colors.inkSecondary,
    lineHeight: 22,
  },
});
