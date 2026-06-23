import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ScreenFrame, TopBackLabel, WarehouseBackground } from '../components/common';
import { BoxImg } from '../components/parcel';
import { styles } from '../styles';

type LandingScreenProps = {
  apiBusy: boolean;
  onLogout: () => void;
  onOpenLocker: () => void;
  onWriteConfession: () => void;
};

export function LandingScreen({
  apiBusy,
  onLogout,
  onOpenLocker,
  onWriteConfession,
}: LandingScreenProps) {
  return (
    <ScreenFrame background={<WarehouseBackground variant="home" />}>
      <View style={styles.screenPadding}>
        <View style={styles.landingHeader}>
          <TopBackLabel label="택배 보관함" boxed />
          <Pressable
            accessibilityLabel="로그아웃"
            disabled={apiBusy}
            onPress={onLogout}
            style={[styles.logoutButton, apiBusy && styles.actionGhostDisabled]}
          >
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </Pressable>
        </View>
        <View style={styles.landingTitleWrap}>
          <Text style={styles.landingTitle}>당신만의 고해성사</Text>
        </View>
        <View style={styles.centerBoxLarge}>
          <BoxImg variant="taped" />
        </View>
        <View style={styles.landingActions}>
          <Pressable onPress={onOpenLocker} style={styles.landingPrimaryButton}>
            <Text style={styles.landingPrimaryButtonText}>소포 훔치기</Text>
          </Pressable>
          <Pressable
            onPress={onWriteConfession}
            style={styles.landingSecondaryButton}
          >
            <Text style={styles.landingSecondaryButtonText}>
              고해성사 보내기
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenFrame>
  );
}
