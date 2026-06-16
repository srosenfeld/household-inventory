import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { RoomListScreenProps } from '../navigation/types';
import { api } from '../services/api';
import { pickImageFromLibrary } from '../services/camera';
import type { Room } from '@household-inventory/shared';

export function RoomListScreen({ navigation, route }: RoomListScreenProps) {
  const { householdId, householdName } = route.params;
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
        householdId,
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.createSection}>
        <TextInput
          style={styles.input}
          placeholder="New room name (e.g. Garage)"
          value={newRoomName}
          onChangeText={setNewRoomName}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreateRoom} disabled={creating}>
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Add room</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#4a6cf7" />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(room) => room.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.roomCard}
              onPress={() =>
                navigation.navigate('RoomLayout', {
                  roomId: item.id,
                  roomName: item.name,
                  householdId,
                })
              }
            >
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomMeta}>{item.photoUrl ? 'Photo mapped' : 'No photo yet'}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No rooms yet. Create your first room above.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    padding: 20,
  },
  createSection: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e8e8ef',
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#4a6cf7',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loader: {
    marginTop: 40,
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8ef',
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  roomMeta: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});
