import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import type { CaptureScreenProps } from '../navigation/types';
import { takePhoto, pickImageFromLibrary } from '../services/camera';
import { api } from '../services/api';

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
    <View style={styles.container}>
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
        <TouchableOpacity style={styles.button} onPress={handleCapture}>
          <Text style={styles.buttonText}>Take photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handlePick}>
          <Text style={styles.buttonText}>Choose from library</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.scanButton, !photoUri && styles.disabled]}
        onPress={handleScan}
        disabled={!photoUri || scanning}
      >
        {scanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.scanButtonText}>Identify items with AI</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
  },
  preview: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#e8e8ef',
  },
  placeholder: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#e8e8ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#4a6cf7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
