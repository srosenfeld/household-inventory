import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { CreateHouseholdScreenProps } from '../navigation/types';
import { api } from '../services/api';

export function CreateHouseholdScreen({ navigation }: CreateHouseholdScreenProps) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter a household name.');
      return;
    }

    setCreating(true);
    try {
      const household = await api.createHousehold(name.trim());
      navigation.replace('Home', {
        householdId: household.id,
        householdName: household.name,
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create household');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Create your household to start mapping rooms and inventory</Text>

      <TextInput
        style={styles.input}
        placeholder="Household name (e.g. My Home)"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={creating}>
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get started</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e8e8ef',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4a6cf7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
