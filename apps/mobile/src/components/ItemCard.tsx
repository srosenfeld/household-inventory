import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import type { Item } from '@household-inventory/shared';
import { resolveApiUrl } from '../config';
import { colors, spacing } from '../theme';
import { Chip } from './ui/Chip';

interface ItemCardProps {
  item: Item;
  onPress?: () => void;
  onLongPress?: () => void;
  showConfidence?: boolean;
}

export function ItemCard({ item, onPress, onLongPress, showConfidence }: ItemCardProps) {
  const confidence = item.aiMetadata?.confidence as number | undefined;
  const thumbUri = item.photoUrl ? resolveApiUrl(item.photoUrl) : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbPlaceholderText}>{item.name[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.quantity}>×{item.quantity}</Text>
          </View>
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.footer}>
            <Chip label={item.category} />
            {showConfidence && confidence !== undefined && confidence < 0.8 ? (
              <Text style={styles.lowConfidence}>Low confidence</Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: spacing.cardRadius,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.hairline,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    flex: 1,
  },
  quantity: {
    fontSize: 14,
    color: colors.inkSecondary,
    marginLeft: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.inkSecondary,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  lowConfidence: {
    fontSize: 12,
    color: colors.warning,
  },
});
