import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { HomeScreenProps } from '../navigation/types';
import { useHousehold } from '../contexts/HouseholdContext';
import { usePhotoSetup } from '../contexts/PhotoSetupContext';
import { takePhoto } from '../services/camera';
import { ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { householdName } = useHousehold();
  const { addPhotos, clearSession } = usePhotoSetup();
  const [opening, setOpening] = useState(false);

  const handleStartPhotos = async () => {
    setOpening(true);
    clearSession();
    try {
      const uri = await takePhoto();
      if (uri) addPhotos([uri]);
      navigation.navigate('PhotoCapture');
    } catch (err) {
      Alert.alert('Camera', err instanceof Error ? err.message : 'Could not open camera');
    } finally {
      setOpening(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.greeting}>{householdName}</Text>
      <Text style={styles.tagline}>Map your home with photos</Text>

      <TouchableOpacity
        style={styles.cta}
        onPress={handleStartPhotos}
        disabled={opening}
        activeOpacity={0.92}
      >
        {opening ? (
          <ActivityIndicator size="large" color={colors.primaryDeep} />
        ) : (
          <>
            <View style={styles.ctaIcon}>
              <Ionicons
                name={Platform.OS === 'web' ? 'images' : 'camera'}
                size={Platform.OS === 'web' ? 44 : 56}
                color={colors.primaryDeep}
              />
            </View>
            <Text style={styles.ctaTitle}>
              {Platform.OS === 'web' ? 'Add photos' : 'Take photos'}
            </Text>
            <Text style={styles.ctaHint}>
              Photograph closets, drawers, dressers, and shelves — we'll help you sort them into
              rooms.
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.links}>
        <TouchableOpacity onPress={() => navigation.navigate('RoomsTab', { screen: 'RoomList' })}>
          <Text style={styles.link}>Browse rooms</Text>
        </TouchableOpacity>
        <Text style={styles.linkDot}>·</Text>
        <TouchableOpacity onPress={() => navigation.navigate('OITab', { screen: 'OIInsights' })}>
          <Text style={styles.link}>Organizational Intelligence</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  greeting: {
    ...typography.caption,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.heading,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  cta: {
    backgroundColor: colors.primarySoft,
    borderRadius: spacing.cardRadius,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: Platform.OS === 'web' ? spacing.xxl : 48,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  ctaIcon: {
    width: Platform.OS === 'web' ? 80 : 104,
    height: Platform.OS === 'web' ? 80 : 104,
    borderRadius: 999,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  ctaTitle: {
    fontSize: Platform.OS === 'web' ? 22 : 26,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  ctaHint: {
    ...typography.body,
    color: colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  link: {
    ...typography.caption,
    color: colors.primaryDeep,
    fontWeight: '600',
  },
  linkDot: {
    color: colors.inkMuted,
  },
});
