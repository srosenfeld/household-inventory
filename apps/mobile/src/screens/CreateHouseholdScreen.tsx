import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import type { CreateHouseholdScreenProps } from '../navigation/types';
import { api } from '../services/api';
import { AuthLayout } from '../components/AuthLayout';
import { Button, Input } from '../components/ui';
import { colors, spacing, typography } from '../theme';

export function CreateHouseholdScreen({ onComplete }: CreateHouseholdScreenProps) {
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
      onComplete?.(household.id, household.name);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create household');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AuthLayout scrollProps={{ contentContainerStyle: styles.scroll }}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Create your household to start mapping rooms and inventory</Text>

      <Input placeholder="Household name (e.g. My Home)" value={name} onChangeText={setName} />

      <Button title="Get started" onPress={handleCreate} loading={creating} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    justifyContent: 'center',
    flexGrow: 1,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
});
