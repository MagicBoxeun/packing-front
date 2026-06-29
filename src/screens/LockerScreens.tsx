import React from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  ActionPill,
  ScreenFrame,
  WarehouseBackground,
} from '../components/common';
import { BoxImg, ShippingLabelCard } from '../components/parcel';
import { TapedCubeDisplay } from '../features/tape/TapedCubeDisplay';
import { flattenTapeWraps } from '../features/tape/tapeWraps';
import { ConveyorBelt, LockerShell } from '../features/locker';
import { styles } from '../styles';
import { ParcelFeedItem } from '../../api';
import { ReceivedLockerParcel, TapeWrapGroup } from '../types';

type LockerGridScreenProps = {
  apiMessage: string;
  feedLoading: boolean;
  getTapeWraps: (pkg: ParcelFeedItem) => TapeWrapGroup[];
  lead?: string;
  packages: ParcelFeedItem[];
  title?: string;
  onBack: () => void;
  onSelect: (id: string) => void;
};

export function LockerGridScreen({
  apiMessage,
  feedLoading,
  getTapeWraps,
  lead = '받고싶은 소포를 골라보세요',
  packages,
  title = '소포 훔치기',
  onBack,
  onSelect,
}: LockerGridScreenProps) {
  return (
    <ScreenFrame background={<WarehouseBackground />}>
      <LockerShell onBack={onBack} title={title}>
        <Text style={styles.lockerLead}>{lead}</Text>
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

type ReplyLockerScreenProps = {
  apiMessage: string;
  loading: boolean;
  parcels: ReceivedLockerParcel[];
  onBack: () => void;
  onSelect: (id: string) => void;
};

export function ReplyLockerScreen({
  apiMessage,
  loading,
  parcels,
  onBack,
  onSelect,
}: ReplyLockerScreenProps) {
  return (
    <ScreenFrame background={<WarehouseBackground />}>
      <LockerShell onBack={onBack} title="택배 보관함">
        <Text style={styles.lockerLead}>내가 받은 택배를 보관해요</Text>
        {loading ? (
          <Text style={styles.lockerStateText}>
            받은 답장 택배를 불러오는 중...
          </Text>
        ) : parcels.length > 0 ? (
          <View style={styles.replyLockerGrid}>
            {parcels.map(parcel => (
              <Pressable
                key={parcel.id}
                onPress={() => onSelect(parcel.id)}
                style={styles.replyLockerTile}
              >
                <TapedCubeDisplay
                  disableSpin
                  modelScale={0.68}
                  size={138}
                  tapes={parcel.tapes}
                  variant="label"
                />
                <Text style={styles.replyLockerFrom}>
                  from. {parcel.fromNickname ?? '익명'}
                </Text>
                <Text style={styles.replyLockerTo}>
                  to. {parcel.toNickname ?? '나'}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyLockerState}>
            <BoxImg variant="label" size={180} />
            <Text style={styles.emptyLockerText}>아직 받은 택배가 없어요.</Text>
          </View>
        )}
        {apiMessage ? (
          <Text style={styles.lockerError}>{apiMessage}</Text>
        ) : null}
      </LockerShell>
    </ScreenFrame>
  );
}

type ReplyLockerDetailScreenProps = {
  parcel: ReceivedLockerParcel | null;
  onBack: () => void;
};

export function ReplyLockerDetailScreen({
  parcel,
  onBack,
}: ReplyLockerDetailScreenProps) {
  return (
    <ScreenFrame background={<WarehouseBackground />}>
      <LockerShell onBack={onBack} title="택배 보관함">
        <Text style={styles.lockerLead}>내가 받은 송장</Text>
        <View style={styles.replyLabelDetailWrap}>
          <ShippingLabelCard
            body={parcel?.message}
            from={parcel?.fromNickname}
            to={parcel?.toNickname}
          />
        </View>
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
      <LockerShell onBack={onBack} title="소포 훔치기">
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
