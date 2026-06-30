import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { SearchMatch } from '@household-inventory/shared';
import { colors, spacing, typography } from '../theme';

interface SearchResultCardProps {
  match: SearchMatch;
  onPress?: () => void;
}

export function SearchResultCard({ match, onPress }: SearchResultCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={0.85}>
      <Text style={styles.itemName}>{match.itemName}</Text>
      <Text style={styles.location}>
        {match.roomName} → {match.storageAreaName}
      </Text>
      {match.description ? <Text style={styles.description}>{match.description}</Text> : null}
      <View style={styles.footer}>
        <Text style={styles.category}>{match.category}</Text>
        <Text style={styles.matchType}>{match.matchType} match</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: spacing.cardRadius,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  location: {
    fontSize: 14,
    color: colors.primaryDeep,
    marginTop: 4,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: colors.inkSecondary,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  category: {
    ...typography.caption,
    color: colors.inkSecondary,
    textTransform: 'capitalize',
  },
  matchType: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});
