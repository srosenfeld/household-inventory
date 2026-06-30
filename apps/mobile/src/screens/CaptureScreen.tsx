import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, Platform } from 'react-native';
import type { CaptureScreenProps } from '../navigation/types';
import { takePhoto, pickImageFromLibrary } from '../services/camera';
import { api } from '../services/api';
import { Button, ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';

export function CaptureScreen({ navigation, route }: CaptureScreenProps) {
  const { storageAreaId, storageAreaName, roomName, roomId } = route.params;
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const handleCapture = async () => {
    const uri = await takePhoto();
    if (uri) setPhotoUri(uri);
  };

  const handlePick = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) setPhotoUri(uri);
  };

  const handleScan = async () => {
    if (!photoUri) {
      Alert.alert('Photo required', 'Take or select a photo first.');
      return;
    }

    setScanning(true);
    try {
      const result = await api.scanStorageArea(storageAreaId, photoUri);
      navigation.replace('ReviewItems', {
        storageAreaId,
        roomId,
        scanJobId: result.scanJobId,
        draftItems: result.items,
        storageAreaName,
        roomName,
      });
    } catch (err) {
      Alert.alert('Scan failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setScanning(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Scan {storageAreaName}</Text>
      <Text style={styles.subtitle}>Photograph the contents of this storage area</Text>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No photo yet</Text>
        </View>
      )}

      <View style={styles.actions}>
        {Platform.OS !== 'web' ? (
          <Button title="Take photo" variant="secondary" onPress={handleCapture} style={styles.actionBtn} />
        ) : null}
        <Button
          title={Platform.OS === 'web' ? 'Choose photo' : 'From library'}
          variant="secondary"
          onPress={handlePick}
          style={styles.actionBtn}
        />
      </View>

      <Button
        title="Identify items with AI"
        onPress={handleScan}
        loading={scanning}
        disabled={!photoUri}
        style={styles.scanButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.sectionTitle,
    fontSize: 22,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  preview: {
    width: '100%',
    height: 280,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.hairline,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  placeholder: {
    width: '100%',
    height: 280,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  placeholderText: {
    color: colors.inkMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
  scanButton: {
    marginTop: spacing.lg,
  },
});
