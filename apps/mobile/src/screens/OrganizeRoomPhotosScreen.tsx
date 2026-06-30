import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import type { OrganizeRoomPhotosScreenProps } from '../navigation/types';
import { useHousehold } from '../contexts/HouseholdContext';
import { usePhotoSetup, type PhotoOrganization } from '../contexts/PhotoSetupContext';
import { savePhotoSetupToHousehold } from '../services/photoSetup';
import { Button, Chip, ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import { STORAGE_AREA_TYPES, type StorageAreaType } from '@household-inventory/shared';

function defaultOrg(index: number, total: number): PhotoOrganization {
  if (total === 1 || index === 0) {
    return { role: 'room_overview', storageAreaName: '', storageAreaType: 'other' };
  }
  return {
    role: 'storage_area',
    storageAreaName: `Storage area ${index}`,
    storageAreaType: 'other',
  };
}

export function OrganizeRoomPhotosScreen({ navigation }: OrganizeRoomPhotosScreenProps) {
  const { householdId } = useHousehold();
  const { roomGroups, photos, updatePhotoOrganization, clearSession } = usePhotoSetup();
  const [saving, setSaving] = useState(false);

  const getOrg = (photoId: string, index: number, total: number): PhotoOrganization => {
    const photo = photos.find((p) => p.id === photoId);
    return photo?.organization ?? defaultOrg(index, total);
  };

  const setRole = (photoId: string, role: PhotoOrganization['role'], index: number, total: number, roomPhotoIds: string[]) => {
    const current = getOrg(photoId, index, total);
    if (role === 'room_overview') {
      for (const id of roomPhotoIds) {
        if (id !== photoId) {
          const p = photos.find((x) => x.id === id);
          const idx = roomPhotoIds.indexOf(id);
          if (p?.organization?.role === 'room_overview') {
            updatePhotoOrganization(id, {
              role: 'storage_area',
              storageAreaName: p.organization.storageAreaName || `Storage area ${idx + 1}`,
              storageAreaType: p.organization.storageAreaType || 'other',
            });
          }
        }
      }
    }
    updatePhotoOrganization(photoId, {
      ...current,
      role,
      storageAreaName: role === 'room_overview' ? '' : current.storageAreaName || `Storage area ${index + 1}`,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const groups = roomGroups.map((g) => ({
        assignment: g.assignment,
        photos: g.photos.map((p, index) => ({
          ...p,
          organization: getOrg(p.id, index, g.photos.length),
        })),
      }));

      const saved = await savePhotoSetupToHousehold(householdId, groups);
      clearSession();

      if (saved.length === 1) {
        navigation.navigate('RoomsTab', {
          screen: 'RoomLayout',
          params: { roomId: saved[0].roomId, roomName: saved[0].roomName },
        });
      } else {
        navigation.navigate('RoomsTab', { screen: 'RoomList' });
        Alert.alert(
          'Rooms updated',
          `Saved photos to ${saved.length} rooms. Open the Rooms tab to fine-tune layout.`
        );
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (roomGroups.length === 0) {
    return (
      <ScreenContainer>
        <Text style={styles.empty}>No photos assigned to rooms yet.</Text>
        <Button title="Go back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerPad}>
          <Text style={styles.title}>Name & categorize</Text>
          <Text style={styles.subtitle}>
            Pick one room overview photo per room. Name each closet, drawer, dresser, or shelf as
            a storage area.
          </Text>
        </View>

        {roomGroups.map((group) => {
          const photoIds = group.photos.map((p) => p.id);
          return (
            <View key={group.key} style={styles.roomSection}>
              <Text style={styles.roomTitle}>{group.roomName}</Text>
              {group.photos.map((photo, index) => {
                const org = getOrg(photo.id, index, group.photos.length);
                return (
                  <View key={photo.id} style={styles.photoCard}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                    <View style={styles.photoFields}>
                      <View style={styles.roleRow}>
                        <TouchableOpacity
                          style={[styles.roleBtn, org.role === 'room_overview' && styles.roleBtnActive]}
                          onPress={() => setRole(photo.id, 'room_overview', index, group.photos.length, photoIds)}
                        >
                          <Text
                            style={[
                              styles.roleBtnText,
                              org.role === 'room_overview' && styles.roleBtnTextActive,
                            ]}
                          >
                            Room photo
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.roleBtn, org.role === 'storage_area' && styles.roleBtnActive]}
                          onPress={() => setRole(photo.id, 'storage_area', index, group.photos.length, photoIds)}
                        >
                          <Text
                            style={[
                              styles.roleBtnText,
                              org.role === 'storage_area' && styles.roleBtnTextActive,
                            ]}
                          >
                            Storage area
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {org.role === 'storage_area' ? (
                        <>
                          <TextInput
                            style={styles.nameInput}
                            value={org.storageAreaName}
                            onChangeText={(storageAreaName) =>
                              updatePhotoOrganization(photo.id, { ...org, storageAreaName })
                            }
                            placeholder="Name (e.g. Dresser top drawer)"
                            placeholderTextColor={colors.inkMuted}
                          />
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
                            {STORAGE_AREA_TYPES.map((type) => (
                              <Chip
                                key={type}
                                label={type}
                                selected={org.storageAreaType === type}
                                onPress={() =>
                                  updatePhotoOrganization(photo.id, {
                                    ...org,
                                    storageAreaType: type as StorageAreaType,
                                  })
                                }
                                style={styles.typeChip}
                              />
                            ))}
                          </ScrollView>
                        </>
                      ) : (
                        <Text style={styles.overviewHint}>Used as the main room layout image</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.savePad}>
          <Button title="Save rooms & storage areas" onPress={handleSave} loading={saving} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  headerPad: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    lineHeight: 22,
  },
  roomSection: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  roomTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  photoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.canvas,
    borderRadius: spacing.cardRadius,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: spacing.inputRadius,
    backgroundColor: colors.hairline,
  },
  photoFields: {
    flex: 1,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: spacing.buttonRadius,
    backgroundColor: colors.canvasSoft,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  roleBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  roleBtnTextActive: {
    color: colors.primaryDeep,
  },
  nameInput: {
    backgroundColor: colors.canvasSoft,
    borderRadius: spacing.inputRadius,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.hairline,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexGrow: 0,
  },
  typeChip: {
    marginRight: spacing.xs,
  },
  overviewHint: {
    ...typography.caption,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
  savePad: {
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: spacing.lg,
  },
});
