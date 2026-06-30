import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import type { ReviewItemsScreenProps } from '../navigation/types';
import type { DraftItem } from '@household-inventory/shared';
import { api } from '../services/api';
import { Button, ScreenContainer } from '../components/ui';
import { colors, spacing, typography } from '../theme';

export function ReviewItemsScreen({ navigation, route }: ReviewItemsScreenProps) {
  const { storageAreaId, roomId, scanJobId, storageAreaName, roomName } = route.params;
  const [items, setItems] = useState<DraftItem[]>(route.params.draftItems);
  const [saving, setSaving] = useState(false);

  const updateItem = (tempId: string, updates: Partial<DraftItem>) => {
    setItems((prev) => prev.map((item) => (item.tempId === tempId ? { ...item, ...updates } : item)));
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleSave = async () => {
    if (items.length === 0) {
      Alert.alert('No items', 'Add at least one item or go back.');
      return;
    }

    setSaving(true);
    try {
      await api.saveScanItems(scanJobId, items);
      navigation.navigate('StorageArea', {
        storageAreaId,
        storageAreaName,
        roomId,
        roomName,
      });
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.inner}>
        <Text style={styles.subtitle}>Edit names, quantities, or remove incorrect items before saving.</Text>

        <FlatList
          data={items}
          keyExtractor={(item) => item.tempId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <TextInput
                  style={styles.nameInput}
                  value={item.name}
                  onChangeText={(text) => updateItem(item.tempId, { name: text })}
                />
                <TouchableOpacity onPress={() => removeItem(item.tempId)}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.descInput}
                value={item.description ?? ''}
                onChangeText={(text) => updateItem(item.tempId, { description: text })}
                placeholder="Description"
                placeholderTextColor={colors.inkMuted}
                multiline
              />

              <View style={styles.row}>
                <Text style={styles.label}>Qty:</Text>
                <TextInput
                  style={styles.qtyInput}
                  value={String(item.quantity)}
                  keyboardType="number-pad"
                  onChangeText={(text) => {
                    const qty = parseInt(text, 10);
                    if (!isNaN(qty) && qty >= 1) updateItem(item.tempId, { quantity: qty });
                  }}
                />
                <Text style={styles.label}>Category:</Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>

              {item.confidence !== undefined && item.confidence < 0.8 ? (
                <Text style={styles.lowConfidence}>
                  Low confidence ({Math.round(item.confidence * 100)}%) — please verify
                </Text>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No items detected. Go back and try another photo.</Text>
          }
        />

        <Button
          title={`Save ${items.length} item(s) to inventory`}
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginBottom: spacing.lg,
  },
  list: {
    paddingBottom: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.canvas,
    borderRadius: spacing.cardRadius,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 4,
  },
  remove: {
    color: colors.destructive,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  descInput: {
    fontSize: 14,
    color: colors.inkSecondary,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  qtyInput: {
    width: 40,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    textAlign: 'center',
    color: colors.ink,
  },
  category: {
    fontSize: 13,
    color: colors.primaryDeep,
    textTransform: 'capitalize',
  },
  lowConfidence: {
    fontSize: 12,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  empty: {
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
