import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { ParcelFeedItem } from '../../../api';
import { BELT_ITEM_WIDTH } from '../../constants';
import { BoxImg } from '../../components/parcel';
import { TopBackLabel } from '../../components/common';
import { styles } from '../../styles';

export function LockerShell({
  children,
  onBack,
  title,
}: {
  children: React.ReactNode;
  onBack?: () => void;
  title: string;
}) {
  return (
    <View style={styles.lockerShell}>
      <TopBackLabel label={title} onBack={onBack} />
      {children}
    </View>
  );
}

type BeltPackage = {
  id: string;
  nickname: string;
  tagline: string;
  key: string;
};


const BELT_SPEED = 1.4;
const BELT_TICK_MS = 16;

export function ConveyorBelt({
  packages,
  onSelect,
}: {
  packages: ParcelFeedItem[];
  onSelect: (id: string) => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const beltWidth = Math.max(screenWidth - 36, 280);

  const items = useMemo<BeltPackage[]>(() => {
    const cycles = 4;
    const repeated: BeltPackage[] = [];
    for (let i = 0; i < cycles; i += 1) {
      packages.forEach(pkg => {
        repeated.push({ ...pkg, key: `belt-${i}-${pkg.id}` });
      });
    }
    return repeated;
  }, [packages]);

  const [positions, setPositions] = useState<number[]>(() => {
    let cursor = -BELT_ITEM_WIDTH - 40;
    return items.map(() => {
      const gap = BELT_ITEM_WIDTH + 50 + Math.random() * 170;
      cursor += gap;
      return cursor;
    });
  });

  useEffect(() => {
    const resetThreshold = beltWidth + BELT_ITEM_WIDTH + 40;
    const resetX = -BELT_ITEM_WIDTH - 40;
    const interval = setInterval(() => {
      setPositions(prev =>
        prev.map(x => {
          const next = x + BELT_SPEED;
          return next > resetThreshold ? resetX : next;
        }),
      );
    }, BELT_TICK_MS);
    return () => clearInterval(interval);
  }, [beltWidth]);

  return (
    <View style={styles.conveyorArea}>
      {items.map((pkg, i) => (
        <Pressable
          key={pkg.key}
          onPress={() => onSelect(pkg.id)}
          style={[
            styles.conveyorItem,
            {
              transform: [{ translateX: positions[i] }, { translateY: 200 }],
            },
          ]}
        >
          <BoxImg variant="taped" size={140} />
          <Text style={styles.packageFrom}>from. {pkg.nickname}</Text>
        </Pressable>
      ))}
    </View>
  );
}
