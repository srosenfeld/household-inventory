import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { Button, Input } from '../components/ui';
import { colors, spacing, typography } from '../theme';

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
      Alert.alert('Confirm your email', 'We sent a confirmation link to your new email address.');
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
        <ActivityIndicator size="large" color={colors.primary} />
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
                <ActivityIndicator color={colors.ink} />
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
      <Text style={styles.fieldLabel}>First name</Text>
      <Input value={firstName} onChangeText={setFirstName} />
      <Text style={styles.fieldLabel}>Last name</Text>
      <Input value={lastName} onChangeText={setLastName} />
      <Button title="Save profile" onPress={handleSaveProfile} loading={saving} />

      <Text style={styles.sectionTitle}>Email</Text>
      <Input
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Button title="Update email" variant="secondary" onPress={handleUpdateEmail} disabled={saving} />

      <Text style={styles.sectionTitle}>Password</Text>
      <Input placeholder="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
      <Input
        placeholder="Confirm new password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button title="Update password" variant="secondary" onPress={handleUpdatePassword} disabled={saving} />

      <Button title="Sign out" variant="destructive" onPress={handleSignOut} style={styles.signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvasSoft },
  content: { padding: spacing.screenPadding, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvasSoft,
  },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarInitial: { color: colors.primaryDeep, fontSize: 36, fontWeight: '700' },
  changePhoto: { color: colors.primaryDeep, marginTop: spacing.sm, fontWeight: '500' },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  fieldLabel: { ...typography.label, color: colors.inkSecondary, marginBottom: 6 },
  signOut: { marginTop: spacing.xxl },
});
