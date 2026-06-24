import React from 'react';
import { Text, View } from 'react-native';

import {
  ActionPill,
  ScreenFrame,
  WarehouseBackground,
} from '../components/common';
import { BoxImg } from '../components/parcel';
import { TapedCubeDisplay } from '../features/tape/TapedCubeDisplay';
import { flattenTapeWraps } from '../features/tape/tapeWraps';
import { ConveyorBelt, LockerShell } from '../features/locker';
import { styles } from '../styles';
import { ParcelFeedItem } from '../../api';
import { TapeWrapGroup } from '../types';

type LockerGridScreenProps = {
  apiMessage: string;
  feedLoading: boolean;
  getTapeWraps: (pkg: ParcelFeedItem) => TapeWrapGroup[];
  packages: ParcelFeedItem[];
  onBack: () => void;
  onSelect: (id: string) => void;
};

export function LockerGridScreen({
  apiMessage,
  feedLoading,
  getTapeWraps,
  packages,
  onBack,
  onSelect,
}: LockerGridScreenProps) {
  return (
    <ScreenFrame background={<WarehouseBackground />}>
      <LockerShell onBack={onBack} title="택배 보관함">
        <Text style={styles.lockerLead}>받고싶은 소포를 골라보세요</Text>
        {feedLoading ? (
          <Text style={styles.lockerStateText}>소포를 불러오는 중...</Text>
        ) : packages.length > 0 ? (
          <ConveyorBelt
            getTapeWraps={getTapeWraps}
            packages={packages}
            onSelect={onSelect}
          />
        ) : (
          <Text style={styles.lockerStateText}>
            지금은 받을 수 있는 소포가 없어요.
          </Text>
        )}
        {apiMessage ? (
          <Text style={styles.lockerError}>{apiMessage}</Text>
        ) : null}
      </LockerShell>
    </ScreenFrame>
  );
}

type LockerDetailScreenProps = {
  getTapeWraps: (pkg: ParcelFeedItem) => TapeWrapGroup[];
  selectedParcel: ParcelFeedItem | null;
  onBack: () => void;
  onOpen: () => void;
};

export function LockerDetailScreen({
  getTapeWraps,
  selectedParcel,
  onBack,
  onOpen,
}: LockerDetailScreenProps) {
  return (
    <ScreenFrame background={<WarehouseBackground />}>
      <LockerShell onBack={onBack} title="택배 보관함">
        <View style={styles.detailBoxWrap}>
          {selectedParcel ? (
            <TapedCubeDisplay
              size={280}
              tapes={flattenTapeWraps(getTapeWraps(selectedParcel))}
              variant="plain"
            />
          ) : (
            <BoxImg variant="taped" size={280} />
          )}
        </View>
        {selectedParcel ? (
          <Text style={styles.packageFrom}>{selectedParcel.nickname}</Text>
        ) : null}
        <View style={styles.lockerDetailAction}>
          <ActionPill label="이 소포 열기" onPress={onOpen} />
        </View>
      </LockerShell>
    </ScreenFrame>
  );
}
