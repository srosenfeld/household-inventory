import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { SearchMatch } from '@household-inventory/shared';

interface SearchResultCardProps {
  match: SearchMatch;
  onPress?: () => void;
}

export function SearchResultCard({ match, onPress }: SearchResultCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress}>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8ef',
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  location: {
    fontSize: 14,
    color: '#4a6cf7',
    marginTop: 4,
    fontWeight: '500',
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
    color: '#666',
    textTransform: 'capitalize',
  },
  matchType: {
    fontSize: 12,
    color: '#999',
  },
});
