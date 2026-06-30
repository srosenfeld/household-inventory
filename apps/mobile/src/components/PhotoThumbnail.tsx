import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface PhotoThumbnailProps {
  uri: string | null;
  onPress: () => void;
  label?: string;
  size?: number;
  loading?: boolean;
}

export function PhotoThumbnail({
  uri,
  onPress,
  label = 'Add photo',
  size = 72,
  loading = false,
}: PhotoThumbnailProps) {
  return (
    <TouchableOpacity
      style={[styles.wrap, { width: size, height: size }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 8 }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 8 }]}>
          <Text style={styles.placeholderText}>+</Text>
        </View>
      )}
      {loading ? (
        <View style={[styles.overlay, { borderRadius: size / 8 }]}>
          <ActivityIndicator color={colors.ink} size="small" />
        </View>
      ) : null}
      <Text style={styles.label} numberOfLines={1}>
        {uri ? 'Change' : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  image: {
    backgroundColor: colors.hairline,
  },
  placeholder: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: colors.primaryDeep,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 18,
  },
  label: {
    ...typography.caption,
    color: colors.primaryDeep,
    marginTop: 4,
    maxWidth: 80,
    textAlign: 'center',
  },
});
