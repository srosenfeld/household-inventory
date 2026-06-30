import { Platform } from 'react-native';

/** Append an image URI to FormData in a way that works on native and web. */
export async function appendPhotoToFormData(
  formData: FormData,
  uri: string,
  fieldName = 'photo',
  filename = 'photo.jpg'
): Promise<void> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append(fieldName, blob, filename);
    return;
  }

  formData.append(
    fieldName,
    {
      uri,
      name: filename,
      type: 'image/jpeg',
    } as unknown as Blob
  );
}
