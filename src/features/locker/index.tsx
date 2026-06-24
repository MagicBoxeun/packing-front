import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { ParcelFeedItem } from '../../../api';
import { BELT_ITEM_WIDTH } from '../../constants';
import { TopBackLabel } from '../../components/common';
import { TapedCubeDisplay } from '../tape/TapedCubeDisplay';
import { flattenTapeWraps } from '../tape/tapeWraps';
import { styles } from '../../styles';
import { TapeWrapGroup } from '../../types';

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
const BELT_ITEM_SPACING = BELT_ITEM_WIDTH + 120;
const BELT_VERTICAL_OFFSET = 246;
const BELT_START_X = -BELT_ITEM_WIDTH - 40;

function createBeltPositions(count: number) {
  return Array.from(
    { length: count },
    (_, index) => BELT_START_X + index * BELT_ITEM_SPACING,
  );
}

export function ConveyorBelt({
  getTapeWraps,
  packages,
  onSelect,
}: {
  getTapeWraps: (pkg: ParcelFeedItem) => TapeWrapGroup[];
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

  const [positions, setPositions] = useState<number[]>(() =>
    createBeltPositions(items.length),
  );

  useEffect(() => {
    setPositions(createBeltPositions(items.length));
  }, [items.length]);

  useEffect(() => {
    const resetThreshold = beltWidth + BELT_ITEM_WIDTH + 40;
    const interval = setInterval(() => {
      setPositions(prev => {
        if (prev.length !== items.length) {
          return createBeltPositions(items.length);
        }
        if (prev.length === 0) {
          return prev;
        }

        const nextPositions = prev.map(x => x + BELT_SPEED);
        let leftmost = Math.min(...nextPositions);
        return nextPositions.map(x => {
          if (x <= resetThreshold) {
            return x;
          }
          const wrapped = leftmost - BELT_ITEM_SPACING;
          leftmost = wrapped;
          return wrapped;
        });
      });
    }, BELT_TICK_MS);
    return () => clearInterval(interval);
  }, [beltWidth, items.length]);

  return (
    <View style={styles.conveyorArea}>
      {items.map((pkg, i) => (
        <Pressable
          key={pkg.key}
          onPress={() => onSelect(pkg.id)}
          style={[
            styles.conveyorItem,
            {
              transform: [
                { translateX: positions[i] ?? BELT_START_X },
                { translateY: BELT_VERTICAL_OFFSET },
              ],
            },
          ]}
        >
          <TapedCubeDisplay
            disableSpin
            modelScale={0.75}
            size={160}
            tapes={flattenTapeWraps(getTapeWraps(pkg))}
            variant="plain"
          />
          <Text style={styles.conveyorPackageFrom}>{pkg.nickname}</Text>
        </Pressable>
      ))}
    </View>
  );
}
