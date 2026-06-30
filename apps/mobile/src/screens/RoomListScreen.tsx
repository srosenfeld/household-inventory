import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { RoomListScreenProps } from '../navigation/types';
import { useHousehold } from '../contexts/HouseholdContext';
import { api } from '../services/api';
import { pickImageFromLibrary } from '../services/camera';
import { Button, Card, Input, ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import type { Room } from '@household-inventory/shared';

export function RoomListScreen({ navigation }: RoomListScreenProps) {
  const { householdId } = useHousehold();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadRooms = useCallback(async () => {
    try {
      const data = await api.getRooms(householdId);
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms])
  );

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      Alert.alert('Name required', 'Enter a room name.');
      return;
    }

    setCreating(true);
    try {
      const photoUri = await pickImageFromLibrary();
      const room = await api.createRoom({
        householdId,
        name: newRoomName.trim(),
        photoUri: photoUri ?? undefined,
      });
      setNewRoomName('');
      navigation.navigate('RoomLayout', {
        roomId: room.id,
        roomName: room.name,
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.sectionTitle}>Add a room</Text>
      <Input placeholder="New room name (e.g. Garage)" value={newRoomName} onChangeText={setNewRoomName} />
      <Button title="Add room" onPress={handleCreateRoom} loading={creating} style={styles.addButton} />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(room) => room.id}
          renderItem={({ item }) => (
            <Card
              onPress={() =>
                navigation.navigate('RoomLayout', {
                  roomId: item.id,
                  roomName: item.name,
                })
              }
            >
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomMeta}>{item.photoUrl ? 'Photo mapped' : 'No photo yet'}</Text>
            </Card>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No rooms yet. Create your first room above.</Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  addButton: {
    marginBottom: spacing.xl,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  roomMeta: {
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 4,
  },
  empty: {
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
