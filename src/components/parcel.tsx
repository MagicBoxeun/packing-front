import React from 'react';
import { Image, Text, View } from 'react-native';

import { styles } from '../styles';
import { BoxVariant } from '../types';

const BOX_SOURCES: Record<BoxVariant, ReturnType<typeof require>> = {
  plain: require('../../assets/box-plain.png'),
  taped: require('../../assets/box-taped.png'),
  open: require('../../assets/box-open.png'),
  label: require('../../assets/box-label.png'),
  'label-taped': require('../../assets/box-label-taped.png'),
  grid: require('../../assets/box-taped.png'),
};

export function BoxImg({
  size = 212,
  stamp,
  variant,
}: {
  size?: number;
  stamp?: 'confession' | 'ok';
  variant: BoxVariant;
}) {
  return (
    <View style={{ height: size, width: size }}>
      <Image
        resizeMode="contain"
        source={BOX_SOURCES[variant]}
        style={{ width: '100%', height: '100%' }}
      />
      {stamp === 'confession' ? (
        <Image
          resizeMode="contain"
          source={require('../../assets/stamp-confession.png')}
          style={[
            styles.stampOverlay,
            { height: size * 0.55, width: size * 0.55 },
          ]}
        />
      ) : null}
      {stamp === 'ok' ? (
        <Image
          resizeMode="contain"
          source={require('../../assets/stamp-ok.png')}
          style={[
            styles.stampOverlay,
            { height: size * 0.6, width: size * 0.6 },
          ]}
        />
      ) : null}
    </View>
  );
}

export function ParcelTopCard() {
  return (
    <View style={styles.parcelTopWrap}>
      <View style={styles.parcelLid} />
      <View style={styles.parcelSeam} />
      <View style={styles.parcelSticker}>
        <View style={styles.parcelStickerLine} />
        <View
          style={[styles.parcelStickerLine, styles.parcelStickerLineShort]}
        />
        <View
          style={[styles.parcelStickerLine, styles.parcelStickerLineShort]}
        />
      </View>
    </View>
  );
}

export function ShippingLabelCard({
  body,
  compact,
}: {
  body?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.shippingCard, compact && styles.shippingCardCompact]}>
      <View style={styles.shippingHeader}>
        <Barcode />
        <Text style={styles.shippingCode}>송장번호</Text>
        <Barcode />
      </View>
      <View style={styles.shippingInfo}>
        <View style={styles.shippingColTitle}>
          <Text style={styles.verticalKorean}>정보</Text>
        </View>
        <View style={styles.shippingColBody}>
          <Text style={styles.shippingText}>from.</Text>
          <Text style={styles.shippingText}>to.</Text>
        </View>
        <Barcode small />
      </View>
      <View style={styles.shippingMemo}>
        <View style={styles.shippingColTitleRed}>
          <Text style={styles.verticalKoreanRed}>내용</Text>
        </View>
        <Text style={styles.shippingMemoText}>{body || ''}</Text>
      </View>
    </View>
  );
}

export function Barcode({ small }: { small?: boolean }) {
  return (
    <View style={[styles.barcode, small && styles.barcodeSmall]}>
      {Array.from({ length: small ? 6 : 9 }).map((_, index) => (
        <View
          key={`barcode-${small ? 'small' : 'full'}-${index}`}
          style={[
            styles.barcodeLine,
            index % 2 === 0 ? styles.barcodeThick : styles.barcodeThin,
          ]}
        />
      ))}
    </View>
  );
}
