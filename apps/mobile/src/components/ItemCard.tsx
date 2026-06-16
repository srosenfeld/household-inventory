import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Item } from '@household-inventory/shared';

interface ItemCardProps {
  item: Item;
  onPress?: () => void;
  onLongPress?: () => void;
  showConfidence?: boolean;
}

export function ItemCard({ item, onPress, onLongPress, showConfidence }: ItemCardProps) {
  const confidence = item.aiMetadata?.confidence as number | undefined;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.quantity}>×{item.quantity}</Text>
      </View>
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      <View style={styles.footer}>
        <Text style={styles.category}>{item.category}</Text>
        {showConfidence && confidence !== undefined && confidence < 0.8 ? (
          <Text style={styles.lowConfidence}>Low confidence</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8ef',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
  },
  quantity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  category: {
    fontSize: 12,
    color: '#4a6cf7',
    textTransform: 'capitalize',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  lowConfidence: {
    fontSize: 12,
    color: '#e67e22',
  },
});
