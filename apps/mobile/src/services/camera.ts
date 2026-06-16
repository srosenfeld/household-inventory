import * as ImagePicker from 'expo-image-picker';

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function pickImageFromLibrary(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Photo library access is required to choose a profile picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}
