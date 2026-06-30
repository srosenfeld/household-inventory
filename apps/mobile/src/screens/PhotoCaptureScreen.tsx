import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PhotoCaptureScreenProps } from '../navigation/types';
import { usePhotoSetup } from '../contexts/PhotoSetupContext';
import { pickMultipleImagesFromLibrary, takePhoto } from '../services/camera';
import { Button, ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';

export function PhotoCaptureScreen({ navigation }: PhotoCaptureScreenProps) {
  const { photos, addPhotos, removePhoto } = usePhotoSetup();
  const [busy, setBusy] = useState(false);

  const handleTakePhoto = useCallback(async () => {
    setBusy(true);
    try {
      const uri = await takePhoto();
      if (uri) addPhotos([uri]);
    } catch (err) {
      Alert.alert('Camera', err instanceof Error ? err.message : 'Could not open camera');
    } finally {
      setBusy(false);
    }
  }, [addPhotos]);

  const handlePickMore = useCallback(async () => {
    setBusy(true);
    try {
      const uris = await pickMultipleImagesFromLibrary();
      if (uris.length) addPhotos(uris);
    } catch (err) {
      Alert.alert('Photos', err instanceof Error ? err.message : 'Could not open library');
    } finally {
      setBusy(false);
    }
  }, [addPhotos]);

  const handleContinue = () => {
    if (photos.length === 0) {
      Alert.alert('Add photos first', 'Take at least one photo of a room or storage area.');
      return;
    }
    navigation.navigate('AssignPhotosToRooms');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Photograph your spaces</Text>
      <Text style={styles.subtitle}>
        Capture closets, dressers, drawers, shelves — as many as you like. You'll sort them into
        rooms next.
      </Text>

      <TouchableOpacity
        style={styles.heroButton}
        onPress={handleTakePhoto}
        disabled={busy}
        activeOpacity={0.9}
      >
        <View style={styles.heroIconWrap}>
          <Ionicons name="camera" size={Platform.OS === 'web' ? 40 : 52} color={colors.primaryDeep} />
        </View>
        <Text style={styles.heroButtonTitle}>
          {Platform.OS === 'web' ? 'Choose photos' : 'Take a photo'}
        </Text>
        <Text style={styles.heroButtonHint}>
          {Platform.OS === 'web'
            ? 'Select images from your device'
            : 'Opens your camera — tap again for each new shot'}
        </Text>
      </TouchableOpacity>

      <Button
        title="Add from photo library"
        variant="secondary"
        onPress={handlePickMore}
        loading={busy}
        style={styles.libraryButton}
      />

      {photos.length > 0 ? (
        <>
          <Text style={styles.countLabel}>{photos.length} photo{photos.length === 1 ? '' : 's'} ready</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filmstrip}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.thumbWrap}>
                <Image source={{ uri: photo.uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removePhoto(photo.id)}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={22} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <Button title={`Continue with ${photos.length} photo${photos.length === 1 ? '' : 's'}`} onPress={handleContinue} />
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  heroButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: spacing.cardRadius,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  heroButtonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  heroButtonHint: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 260,
  },
  libraryButton: {
    marginBottom: spacing.xl,
  },
  countLabel: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  filmstrip: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: spacing.inputRadius,
    backgroundColor: colors.hairline,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.canvas,
    borderRadius: 12,
  },
});
