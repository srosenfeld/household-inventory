import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { HomeScreenProps } from '../navigation/types';
import { useHousehold } from '../contexts/HouseholdContext';
import { api } from '../services/api';
import { ItemCard } from '../components/ItemCard';
import { Button, Card, ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import type { Item } from '@household-inventory/shared';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { householdId, householdName } = useHousehold();
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
    <ScreenContainer>
      <Text style={styles.title}>{householdName}</Text>
      <Text style={styles.subtitle}>Your household inventory</Text>

      <Card
        onPress={() => navigation.navigate('OITab', { screen: 'OIInsights' })}
        style={styles.oiPromo}
      >
        <Text style={styles.oiPromoEyebrow}>OI</Text>
        <Text style={styles.oiPromoTitle}>Organizational Intelligence</Text>
        <Text style={styles.oiPromoBody}>
          See category breakdowns, duplicate items, and expert tips to consolidate storage.
        </Text>
        <Button
          title="View insights"
          variant="secondary"
          onPress={() => navigation.navigate('OITab', { screen: 'OIInsights' })}
          style={styles.oiPromoButton}
        />
      </Card>

      <Text style={styles.sectionTitle}>Recent items</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadItems();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => navigation.navigate('ItemDetail', { itemId: item.id, item })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No items yet. Open the Rooms tab, add a storage area, and scan or add items.
            </Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  oiPromo: {
    marginBottom: spacing.xl,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  oiPromoEyebrow: {
    ...typography.caption,
    color: colors.primaryDeep,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  oiPromoTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  oiPromoBody: {
    ...typography.caption,
    color: colors.inkSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  oiPromoButton: {
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  empty: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    lineHeight: 22,
  },
});
