import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  LayoutChangeEvent,
  Alert,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import type { StorageArea, StorageAreaType } from '@household-inventory/shared';
import { STORAGE_AREA_TYPES } from '@household-inventory/shared';
import { colors, spacing, typography } from '../theme';

export interface LayoutZone
  extends Pick<StorageArea, 'id' | 'name' | 'type' | 'x' | 'y' | 'width' | 'height' | 'photoUrl'> {}

interface LayoutCanvasProps {
  photoUri: string | null;
  zones: LayoutZone[];
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  onUpdateZone: (id: string, updates: Partial<LayoutZone>) => void;
  onAddZone: (zone: Omit<LayoutZone, 'id' | 'name'>) => void;
  onGestureActiveChange?: (active: boolean) => void;
  showAddButton?: boolean;
  compact?: boolean;
}

const ZONE_COLORS: Record<StorageAreaType, string> = {
  shelf: 'rgba(62, 207, 142, 0.25)',
  bin: 'rgba(36, 180, 126, 0.22)',
  drawer: 'rgba(107, 1, 194, 0.15)',
  dresser: 'rgba(247, 104, 8, 0.18)',
  cabinet: 'rgba(62, 207, 142, 0.18)',
  closet: 'rgba(229, 72, 77, 0.15)',
  desk: 'rgba(36, 180, 126, 0.28)',
  other: 'rgba(112, 112, 112, 0.2)',
};

const MIN_FRAC = 0.08;

function DraggableZone({
  zone,
  canvasWidth,
  canvasHeight,
  isSelected,
  onSelect,
  onUpdate,
  onGestureActiveChange,
}: {
  zone: LayoutZone;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<LayoutZone>) => void;
  onGestureActiveChange?: (active: boolean) => void;
}) {
  const offsetX = useSharedValue(zone.x * canvasWidth);
  const offsetY = useSharedValue(zone.y * canvasHeight);
  const zoneW = useSharedValue(zone.width * canvasWidth);
  const zoneH = useSharedValue(zone.height * canvasHeight);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startH = useSharedValue(0);

  useEffect(() => {
    offsetX.value = zone.x * canvasWidth;
    offsetY.value = zone.y * canvasHeight;
    zoneW.value = zone.width * canvasWidth;
    zoneH.value = zone.height * canvasHeight;
  }, [zone.x, zone.y, zone.width, zone.height, canvasWidth, canvasHeight, offsetX, offsetY, zoneW, zoneH]);

  const clampPosition = (x: number, y: number, w: number, h: number) => {
    'worklet';
    return {
      x: Math.max(0, Math.min(canvasWidth - w, x)),
      y: Math.max(0, Math.min(canvasHeight - h, y)),
    };
  };

  const clampSize = (w: number, h: number, x: number, y: number) => {
    'worklet';
    const minW = canvasWidth * MIN_FRAC;
    const minH = canvasHeight * MIN_FRAC;
    return {
      w: Math.max(minW, Math.min(canvasWidth - x, w)),
      h: Math.max(minH, Math.min(canvasHeight - y, h)),
    };
  };

  const notifyActive = (active: boolean) => {
    onGestureActiveChange?.(active);
  };

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onSelect)();
  });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      runOnJS(notifyActive)(true);
      runOnJS(onSelect)();
      startX.value = offsetX.value;
      startY.value = offsetY.value;
    })
    .onUpdate((e) => {
      const clamped = clampPosition(
        startX.value + e.translationX,
        startY.value + e.translationY,
        zoneW.value,
        zoneH.value
      );
      offsetX.value = clamped.x;
      offsetY.value = clamped.y;
    })
    .onEnd(() => {
      runOnJS(onUpdate)({
        x: offsetX.value / canvasWidth,
        y: offsetY.value / canvasHeight,
      });
      runOnJS(notifyActive)(false);
    })
    .onFinalize(() => {
      runOnJS(notifyActive)(false);
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      runOnJS(notifyActive)(true);
      runOnJS(onSelect)();
      startW.value = zoneW.value;
      startH.value = zoneH.value;
    })
    .onUpdate((e) => {
      const next = clampSize(startW.value * e.scale, startH.value * e.scale, offsetX.value, offsetY.value);
      zoneW.value = next.w;
      zoneH.value = next.h;
    })
    .onEnd(() => {
      runOnJS(onUpdate)({
        width: zoneW.value / canvasWidth,
        height: zoneH.value / canvasHeight,
      });
      runOnJS(notifyActive)(false);
    })
    .onFinalize(() => {
      runOnJS(notifyActive)(false);
    });

  const gesture = Gesture.Simultaneous(Gesture.Exclusive(pan, tap), pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
    width: zoneW.value,
    height: zoneH.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.zone,
          animatedStyle,
          {
            backgroundColor: ZONE_COLORS[zone.type as StorageAreaType] ?? ZONE_COLORS.other,
            borderColor: isSelected ? colors.primary : 'rgba(255,255,255,0.9)',
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <Text style={styles.zoneLabel} numberOfLines={1}>
          {zone.name}
        </Text>
        <Text style={styles.zoneType}>{zone.type}</Text>
        {isSelected ? <Text style={styles.zoneHint}>Drag to move · Pinch to resize</Text> : null}
      </Animated.View>
    </GestureDetector>
  );
}

export function LayoutCanvas({
  photoUri,
  zones,
  selectedZoneId,
  onSelectZone,
  onUpdateZone,
  onAddZone,
  onGestureActiveChange,
  showAddButton = true,
  compact = false,
}: LayoutCanvasProps) {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  const handleAddZone = () => {
    Alert.alert('Add storage area', 'Choose a type', [
      ...STORAGE_AREA_TYPES.map((type) => ({
        text: type,
        onPress: () => {
          onAddZone({
            type,
            x: 0.1,
            y: 0.1,
            width: 0.3,
            height: 0.2,
            photoUrl: null,
          });
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View
        style={[styles.canvas, compact && styles.canvasCompact]}
        onLayout={onLayout}
        collapsable={false}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Add a room photo to start mapping</Text>
          </View>
        )}

        {canvasSize.width > 0 &&
          zones.map((zone) => (
            <DraggableZone
              key={zone.id}
              zone={zone}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              isSelected={selectedZoneId === zone.id}
              onSelect={() => onSelectZone(zone.id)}
              onUpdate={(updates) => onUpdateZone(zone.id, updates)}
              onGestureActiveChange={onGestureActiveChange}
            />
          ))}
      </View>

      {showAddButton ? (
        <TouchableOpacity style={styles.addButton} onPress={handleAddZone}>
          <Text style={styles.addButtonText}>+ Add storage area</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerCompact: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    width: '100%',
    overflow: 'hidden',
  },
  canvas: {
    backgroundColor: colors.canvasSoft,
    borderRadius: spacing.cardRadius,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  canvasCompact: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    height: 220,
    minHeight: 220,
    maxHeight: 220,
    width: '100%',
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.hairline,
  },
  placeholderText: {
    color: colors.inkSecondary,
    fontSize: 16,
  },
  zone: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 6,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  zoneLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  zoneType: {
    fontSize: 9,
    color: colors.inkSecondary,
    textTransform: 'capitalize',
  },
  zoneHint: {
    fontSize: 8,
    color: colors.primaryDeep,
    marginTop: 2,
    textAlign: 'center',
  },
  addButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: spacing.buttonRadius,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.ink,
    fontWeight: '600',
    fontSize: 16,
  },
});
