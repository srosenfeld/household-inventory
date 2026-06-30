import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { OIInsightsScreenProps } from '../navigation/types';
import { useHousehold } from '../contexts/HouseholdContext';
import { api } from '../services/api';
import { Card, Chip, ScreenContainer } from '../components/ui';
import { OIInsightExtras } from '../components/oi/OIInsightExtras';
import { colors, spacing, typography } from '../theme';
import type {
  OICategoryTotal,
  OIInsight,
  OIInsightSource,
  OrganizationalIntelligence,
} from '@household-inventory/shared';

const SOURCE_LABELS: Record<OIInsightSource, string> = {
  konmari: 'KonMari',
  home_edit: 'The Home Edit',
  container_store: 'Container Store',
  data: 'Your inventory',
};

const SOURCE_COLORS: Record<OIInsightSource, string> = {
  konmari: '#e5484d',
  home_edit: '#6b01c2',
  container_store: '#24b47e',
  data: '#707070',
};

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CategoryBar({ row, maxQuantity }: { row: OICategoryTotal; maxQuantity: number }) {
  const widthPct = maxQuantity > 0 ? Math.max(8, (row.totalQuantity / maxQuantity) * 100) : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{row.category}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${widthPct}%` }]} />
      </View>
      <Text style={styles.barCount}>{row.totalQuantity}</Text>
    </View>
  );
}

function InsightCard({ item }: { item: OIInsight }) {
  const severityStyle =
    item.severity === 'action'
      ? styles.insightAction
      : item.severity === 'suggestion'
        ? styles.insightSuggestion
        : styles.insightInfo;

  return (
    <Card style={[styles.insightCard, severityStyle]}>
      <View style={styles.insightHeader}>
        <View style={[styles.sourceBadge, { backgroundColor: `${SOURCE_COLORS[item.source]}18` }]}>
          <Text style={[styles.sourceBadgeText, { color: SOURCE_COLORS[item.source] }]}>
            {SOURCE_LABELS[item.source]}
          </Text>
        </View>
        {item.severity === 'action' ? (
          <Chip label="Action" selected style={styles.actionChip} />
        ) : null}
      </View>
      <Text style={styles.insightTitle}>{item.title}</Text>
      <Text style={styles.insightBody}>{item.body}</Text>
      <OIInsightExtras
        contextLabel={item.contextLabel}
        resources={item.resources}
        productPicks={item.productPicks}
      />
    </Card>
  );
}

export function OIInsightsScreen(_props: OIInsightsScreenProps) {
  const { householdId } = useHousehold();
  const [report, setReport] = useState<OrganizationalIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getOrganizationalIntelligence(householdId);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (loading && !report) {
    return (
      <ScreenContainer>
        <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
      </ScreenContainer>
    );
  }

  const maxCategoryQty = report?.categoryTotals[0]?.totalQuantity ?? 1;

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>OI</Text>
          <Text style={styles.heroTitle}>Organizational Intelligence</Text>
          <Text style={styles.heroSubtitle}>
            Insights from your inventory with curated guides, episodes, and storage picks woven
            into each recommendation.
          </Text>
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {report ? (
          <>
            <View style={styles.statsGrid}>
              <StatTile label="Items" value={report.stats.totalItems} />
              <StatTile label="Units" value={report.stats.totalQuantity} />
              <StatTile label="Rooms" value={report.stats.roomCount} />
              <StatTile label="Storage areas" value={report.stats.storageAreaCount} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <Text style={styles.sectionHint}>
                Prioritized suggestions to consolidate, declutter, and optimize storage.
              </Text>
              {report.insights.length === 0 ? (
                <Text style={styles.emptySection}>No insights yet — add more inventory data.</Text>
              ) : (
                report.insights.map((item) => <InsightCard key={item.id} item={item} />)
              )}
            </View>

            {report.categoryTotals.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items by category</Text>
                <Card>
                  {report.categoryTotals.map((row) => (
                    <CategoryBar key={row.category} row={row} maxQuantity={maxCategoryQty} />
                  ))}
                </Card>
              </View>
            ) : null}

            {report.roomSummaries.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rooms at a glance</Text>
                {report.roomSummaries.map((room) => (
                  <Card key={room.roomId}>
                    <Text style={styles.roomName}>{room.roomName}</Text>
                    <Text style={styles.roomMeta}>
                      {room.itemCount} items · {room.totalQuantity} units · {room.storageAreaCount}{' '}
                      storage areas
                    </Text>
                    {room.topCategories.length > 0 ? (
                      <View style={styles.chipRow}>
                        {room.topCategories.map((cat) => (
                          <Chip key={cat} label={cat} style={styles.categoryChip} />
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.roomEmpty}>No items in this room yet</Text>
                    )}
                  </Card>
                ))}
              </View>
            ) : null}

            {report.categoryByRoom.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category distribution by room</Text>
                <Text style={styles.sectionHint}>
                  Spot where the same types of items appear in multiple places.
                </Text>
                <Card>
                  {report.categoryByRoom.map((row) => (
                    <View
                      key={`${row.category}-${row.roomId}`}
                      style={styles.categoryRoomRow}
                    >
                      <Text style={styles.categoryRoomCategory}>{row.category}</Text>
                      <Text style={styles.categoryRoomDetail}>
                        {row.roomName} — {row.itemCount} items ({row.totalQuantity} units)
                      </Text>
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}

            {report.duplicateGroups.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Possible duplicates</Text>
                <Text style={styles.sectionHint}>
                  Same name in different locations — worth a joy check before consolidating.
                </Text>
                {report.duplicateGroups.map((group) => (
                  <Card key={group.normalizedName}>
                    <Text style={styles.duplicateName}>{group.items[0].itemName}</Text>
                    {group.items.map((item) => (
                      <Text key={item.itemId} style={styles.duplicateLocation}>
                        · {item.roomName} → {item.storageAreaName}
                        {item.quantity > 1 ? ` (×${item.quantity})` : ''}
                      </Text>
                    ))}
                  </Card>
                ))}
              </View>
            ) : null}

            {report.emptyStorageAreas.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Empty storage areas</Text>
                {report.emptyStorageAreas.map((area) => (
                  <Card key={area.storageAreaId}>
                    <Text style={styles.roomName}>{area.storageAreaName}</Text>
                    <Text style={styles.roomMeta}>
                      {area.roomName} · {area.storageAreaType}
                    </Text>
                  </Card>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  loader: {
    marginTop: spacing.xxl * 2,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  heroEyebrow: {
    ...typography.caption,
    color: colors.primaryDeep,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.heading,
    color: colors.ink,
    fontSize: 26,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  error: {
    ...typography.body,
    color: colors.destructive,
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.canvas,
    borderRadius: spacing.cardRadius,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
  },
  statLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.inkSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  emptySection: {
    ...typography.body,
    color: colors.inkMuted,
  },
  insightCard: {
    marginBottom: spacing.sm,
  },
  insightAction: {
    borderColor: colors.warning,
    backgroundColor: '#fff8f3',
  },
  insightSuggestion: {
    borderColor: colors.primary,
  },
  insightInfo: {},
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.chipRadius,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  insightTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  insightBody: {
    ...typography.body,
    color: colors.inkSecondary,
    lineHeight: 22,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  barLabel: {
    width: 72,
    ...typography.caption,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.hairline,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  barCount: {
    width: 28,
    textAlign: 'right',
    ...typography.caption,
    color: colors.inkMuted,
    fontWeight: '600',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  roomMeta: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 4,
  },
  roomEmpty: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  categoryChip: {
    marginBottom: 0,
  },
  categoryRoomRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  categoryRoomCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    textTransform: 'capitalize',
  },
  categoryRoomDetail: {
    ...typography.caption,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  duplicateName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  duplicateLocation: {
    ...typography.caption,
    color: colors.inkSecondary,
    lineHeight: 20,
  },
});
