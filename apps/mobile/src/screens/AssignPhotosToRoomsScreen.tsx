import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { AssignPhotosToRoomsScreenProps } from '../navigation/types';
import { useHousehold } from '../contexts/HouseholdContext';
import { usePhotoSetup, type RoomAssignment } from '../contexts/PhotoSetupContext';
import { api } from '../services/api';
import { Button, Input, ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import type { Room } from '@household-inventory/shared';

export function AssignPhotosToRoomsScreen({ navigation }: AssignPhotosToRoomsScreenProps) {
  const { householdId } = useHousehold();
  const { photos, assignPhotos, allAssigned } = usePhotoSetup();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useFocusEffect(
    useCallback(() => {
      api.getRooms(householdId).then(setRooms).catch(console.error);
    }, [householdId])
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAssign = () => {
    if (selected.size === 0) {
      Alert.alert('Select photos', 'Tap one or more photos to assign them to a room.');
      return;
    }
    setNewRoomName('');
    setModalOpen(true);
  };

  const applyAssignment = (assignment: RoomAssignment) => {
    assignPhotos([...selected], assignment);
    setSelected(new Set());
    setModalOpen(false);
  };

  const handleCreateAndAssign = () => {
    const name = newRoomName.trim();
    if (!name) {
      Alert.alert('Room name', 'Enter a name for the new room.');
      return;
    }
    applyAssignment({ kind: 'new', roomName: name });
  };

  const assignmentLabel = (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo?.roomAssignment) return null;
    return photo.roomAssignment.roomName;
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Assign to rooms</Text>
      <Text style={styles.subtitle}>
        Select photos and group them into an existing room or create a new one. You can assign
        different batches to different rooms.
      </Text>

      <FlatList
        data={photos}
        keyExtractor={(p) => p.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          const assigned = assignmentLabel(item.id);
          return (
            <TouchableOpacity
              style={[styles.cell, isSelected && styles.cellSelected]}
              onPress={() => toggleSelect(item.id)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: item.uri }} style={styles.thumb} />
              {isSelected ? (
                <View style={styles.check}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                </View>
              ) : null}
              {assigned ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {assigned}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <Button
          title={selected.size ? `Assign ${selected.size} selected` : 'Assign selected to room'}
          onPress={openAssign}
          variant={selected.size ? 'primary' : 'secondary'}
        />
        <Button
          title="Organize in rooms"
          onPress={() => navigation.navigate('OrganizeRoomPhotos')}
          disabled={!allAssigned}
          style={styles.continueBtn}
        />
      </View>

      <Modal visible={modalOpen} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Assign to room</Text>

            {rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomOption}
                onPress={() => applyAssignment({ kind: 'existing', roomId: room.id, roomName: room.name })}
              >
                <Ionicons name="home-outline" size={20} color={colors.primaryDeep} />
                <Text style={styles.roomOptionText}>{room.name}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.orLabel}>Or create a new room</Text>
            <Input
              placeholder="e.g. Bedroom"
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoCapitalize="words"
            />
            <Button title="Create room & assign" onPress={handleCreateAndAssign} />
          </Pressable>
        </Pressable>
      </Modal>
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
    marginBottom: spacing.lg,
  },
  grid: {
    paddingBottom: spacing.md,
  },
  row: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cell: {
    flex: 1,
    maxWidth: '31%',
    aspectRatio: 1,
    borderRadius: spacing.inputRadius,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellSelected: {
    borderColor: colors.primary,
  },
  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.hairline,
  },
  check: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.canvas,
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  continueBtn: {
    marginTop: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: spacing.cardRadius,
    borderTopRightRadius: spacing.cardRadius,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  roomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  roomOptionText: {
    fontSize: 16,
    color: colors.ink,
    fontWeight: '500',
  },
  orLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
});
