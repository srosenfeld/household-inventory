import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { ProfileScreenProps } from '../navigation/types';
import type { User } from '@household-inventory/shared';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { pickImageFromLibrary } from '../services/camera';
import { resolveApiUrl } from '../config';

export function ProfileScreen(_props: ProfileScreenProps) {
  const { signOut, updateEmail, updatePassword } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
      setFirstName(data.firstName ?? '');
      setLastName(data.lastName ?? '');
      setEmail(data.email);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const profileImageUri =
    localPhotoUri ??
    (profile?.profilePictureUrl
      ? `${resolveApiUrl(profile.profilePictureUrl)}?v=${encodeURIComponent(profile.updatedAt)}`
      : null);

  const handleChangePhoto = async () => {
    let uri: string | null;
    try {
      uri = await pickImageFromLibrary();
    } catch (err) {
      Alert.alert('Permission needed', err instanceof Error ? err.message : 'Cannot access photos');
      return;
    }
    if (!uri) return;

    setLocalPhotoUri(uri);
    setSaving(true);
    try {
      const photoUrl = await api.uploadPhoto(uri);
      const updated = await api.updateProfile({ profilePictureUrl: photoUrl });
      setProfile(updated);
      setLocalPhotoUri(null);
    } catch (err) {
      setLocalPhotoUri(null);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update photo');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      setProfile(updated);
      Alert.alert('Saved', 'Profile updated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim() || email.trim() === profile?.email) return;

    setSaving(true);
    try {
      await updateEmail(email.trim());
      Alert.alert(
        'Confirm your email',
        'We sent a confirmation link to your new email address.'
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Saved', 'Password updated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a6cf7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.avatarWrap} onPress={handleChangePhoto} disabled={saving}>
        {profileImageUri ? (
          <View>
            <Image source={{ uri: profileImageUri }} style={styles.avatar} />
            {saving ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {(firstName[0] ?? email[0] ?? '?').toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.changePhoto}>Change photo</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Profile</Text>
      <Text style={styles.label}>First name</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
      <Text style={styles.label}>Last name</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

      <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Save profile</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TouchableOpacity style={styles.secondaryButton} onPress={handleUpdateEmail} disabled={saving}>
        <Text style={styles.secondaryButtonText}>Update email</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="New password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.secondaryButton} onPress={handleUpdatePassword} disabled={saving}>
        <Text style={styles.secondaryButtonText}>Update password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#4a6cf7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 36, fontWeight: '700' },
  changePhoto: { color: '#4a6cf7', marginTop: 8, fontWeight: '500' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: 16,
    marginBottom: 8,
  },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e8e8ef',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4a6cf7',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a6cf7',
    marginBottom: 8,
  },
  secondaryButtonText: { color: '#4a6cf7', fontWeight: '600' },
  signOutButton: { padding: 16, alignItems: 'center', marginTop: 24 },
  signOutText: { color: '#e74c3c', fontWeight: '600', fontSize: 16 },
});
