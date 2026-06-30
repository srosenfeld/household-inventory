import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OIProductPick, OIResourceLink } from '@household-inventory/shared';
import { colors, spacing, typography } from '../../theme';

const VENDOR_LABELS: Record<OIResourceLink['vendor'] | OIProductPick['vendor'], string> = {
  netflix: 'Netflix',
  marie_kondo: 'Marie Kondo',
  home_edit: 'The Home Edit',
  container_store: 'The Container Store',
  amazon: 'Amazon',
};

const TYPE_ICONS: Record<OIResourceLink['type'], keyof typeof Ionicons.glyphMap> = {
  watch: 'play-circle-outline',
  read: 'book-outline',
  learn: 'bulb-outline',
  shop: 'bag-outline',
};

async function openUrl(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  }
}

function ResourceRow({ resource }: { resource: OIResourceLink }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <TouchableOpacity
      style={styles.resourceRow}
      onPress={() => openUrl(resource.url)}
      activeOpacity={0.85}
    >
      {resource.imageUrl && !imageFailed ? (
        <Image
          source={{ uri: resource.imageUrl }}
          style={styles.resourceThumb}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={styles.resourceIconWrap}>
          <Ionicons name={TYPE_ICONS[resource.type]} size={22} color={colors.primaryDeep} />
        </View>
      )}
      <View style={styles.resourceText}>
        <Text style={styles.resourceVendor}>{VENDOR_LABELS[resource.vendor]}</Text>
        <Text style={styles.resourceTitle}>{resource.title}</Text>
        {resource.subtitle ? (
          <Text style={styles.resourceSubtitle} numberOfLines={2}>
            {resource.subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="open-outline" size={16} color={colors.inkMuted} />
    </TouchableOpacity>
  );
}

function ProductPickRow({ product }: { product: OIProductPick }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <TouchableOpacity
      style={styles.productRow}
      onPress={() => openUrl(product.shopUrl)}
      activeOpacity={0.85}
    >
      {!imageFailed ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.productImage}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.productImage, styles.productImageFallback]}>
          <Ionicons name="cube-outline" size={28} color={colors.inkMuted} />
        </View>
      )}
      <View style={styles.productText}>
        <Text style={styles.productVendor}>{VENDOR_LABELS[product.vendor]}</Text>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription} numberOfLines={3}>
          {product.description}
        </Text>
        {product.fitNote ? (
          <Text style={styles.productFit}>{product.fitNote}</Text>
        ) : null}
        <Text style={styles.productLink}>
          View on {VENDOR_LABELS[product.vendor]} →
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface OIInsightExtrasProps {
  contextLabel?: string;
  resources?: OIResourceLink[];
  productPicks?: OIProductPick[];
}

export function OIInsightExtras({ contextLabel, resources, productPicks }: OIInsightExtrasProps) {
  const hasResources = resources && resources.length > 0;
  const hasProducts = productPicks && productPicks.length > 0;

  if (!hasResources && !hasProducts) return null;

  return (
    <View style={styles.wrap}>
      {contextLabel ? <Text style={styles.contextLabel}>{contextLabel}</Text> : null}

      {hasResources ? (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Ways to go deeper</Text>
          {resources!.map((r) => (
            <ResourceRow key={r.id} resource={r} />
          ))}
        </View>
      ) : null}

      {hasProducts ? (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Sized for your space</Text>
          <Text style={styles.blockHint}>
            Measure your drawer or shelf first — these picks match common dimensions.
          </Text>
          {productPicks!.map((p) => (
            <ProductPickRow key={p.id} product={p} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  contextLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'none',
  },
  block: {
    marginBottom: spacing.sm,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkSecondary,
    marginBottom: spacing.xs,
  },
  blockHint: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  resourceThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.hairline,
  },
  resourceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceText: {
    flex: 1,
  },
  resourceVendor: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 1,
  },
  resourceSubtitle: {
    ...typography.caption,
    color: colors.inkSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  productRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.canvasSoft,
    borderRadius: spacing.inputRadius,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.canvas,
  },
  productImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productText: {
    flex: 1,
  },
  productVendor: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 2,
  },
  productDescription: {
    ...typography.caption,
    color: colors.inkSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  productFit: {
    fontSize: 11,
    color: colors.primaryDeep,
    marginTop: 4,
    fontStyle: 'italic',
  },
  productLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDeep,
    marginTop: 6,
  },
});
