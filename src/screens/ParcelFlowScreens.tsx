import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ActionPill, DarkStage, ScreenFrame, TopGlow } from '../components/common';
import { BoxImg, ParcelTopCard, ShippingLabelCard } from '../components/parcel';
import { TapedCubeDisplay } from '../features/tape/TapedCubeDisplay';
import { styles } from '../styles';
import { TapeData } from '../types';

const SIDE_BURST_PARTICLES = [
  { color: '#fff3a8', delay: 0, dx: 132, dy: -74, size: 8, x: '0%', y: '38%' },
  { color: '#ff6f8f', delay: 34, dx: 156, dy: -28, size: 7, x: '0%', y: '46%' },
  { color: '#7fe4ff', delay: 66, dx: 126, dy: 32, size: 6, x: '0%', y: '54%' },
  { color: '#8fffcb', delay: 20, dx: 174, dy: 72, size: 8, x: '0%', y: '62%' },
  { color: '#ffe2f0', delay: 54, dx: 104, dy: 106, size: 6, x: '0%', y: '70%' },
  { color: '#b9a7ff', delay: 86, dx: 190, dy: -96, size: 7, x: '0%', y: '34%' },
  { color: '#ffd36a', delay: 10, dx: -132, dy: -74, size: 8, x: '100%', y: '38%' },
  { color: '#ffffff', delay: 44, dx: -156, dy: -28, size: 6, x: '100%', y: '46%' },
  { color: '#ff8f5f', delay: 76, dx: -126, dy: 32, size: 7, x: '100%', y: '54%' },
  { color: '#7fe4ff', delay: 30, dx: -174, dy: 72, size: 8, x: '100%', y: '62%' },
  { color: '#fff3a8', delay: 64, dx: -104, dy: 106, size: 6, x: '100%', y: '70%' },
  { color: '#ff6f8f', delay: 96, dx: -190, dy: -96, size: 7, x: '100%', y: '34%' },
];

const SIDE_BURST_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<style>
  * { box-sizing: border-box; }
  html, body {
    background: transparent;
    height: 100%;
    margin: 0;
    overflow: hidden;
    width: 100%;
  }
  .particle {
    animation: sideBurst 1050ms cubic-bezier(.17,.67,.22,1) forwards;
    border-radius: 999px;
    box-shadow: 0 0 10px rgba(255,255,255,0.55);
    height: var(--s);
    left: var(--x);
    opacity: 0;
    position: absolute;
    top: var(--y);
    transform: translate(-50%, -50%) scale(0.25);
    width: var(--s);
  }
  .particle:nth-child(3n) { border-radius: 2px; }
  .particle:nth-child(4n) { height: 3px; }
  @keyframes sideBurst {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.25) rotate(0deg);
    }
    14% {
      opacity: 1;
    }
    72% {
      opacity: 0.95;
    }
    100% {
      opacity: 0;
      transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1) rotate(220deg);
    }
  }
</style>
</head>
<body>
${SIDE_BURST_PARTICLES.map(
  particle =>
    `<i class="particle" style="--x:${particle.x};--y:${particle.y};--dx:${particle.dx}px;--dy:${particle.dy}px;--s:${particle.size}px;background:${particle.color};animation-delay:${particle.delay}ms"></i>`,
).join('')}
</body>
</html>`;

function SideParticleBurst() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 3 }]}>
      <WebView
        source={{ html: SIDE_BURST_HTML }}
        style={{ backgroundColor: 'transparent', flex: 1 }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        opaque={false}
      />
    </View>
  );
}

type TearPackageScreenProps = {
  apiBusy: boolean;
  apiMessage: string;
  onTear: () => void;
  tearCount: number;
};

export function TearPackageScreen({
  apiBusy,
  apiMessage,
  onTear,
  tearCount,
}: TearPackageScreenProps) {
  return (
    <ScreenFrame>
      <DarkStage
        accent={`(${tearCount}/3)`}
        accentDone={tearCount === 3}
        box={<BoxImg variant="taped" />}
        helper="상자를 세 번 탭해 뜯어주세요."
        onBoxPress={() => {
          if (!apiBusy) {
            onTear();
          }
        }}
        title="소포를 뜯어주세요!"
      />
      {apiMessage ? <Text style={styles.stageError}>{apiMessage}</Text> : null}
    </ScreenFrame>
  );
}

type StampedParcelScreenProps = {
  apiBusy?: boolean;
  apiMessage?: string;
  onPress: () => void;
  stamp: 'confession' | 'ok';
  tapes: TapeData[];
  variant: 'plain' | 'label';
};

export function StampedParcelScreen({
  apiBusy,
  apiMessage,
  onPress,
  stamp,
  tapes,
  variant,
}: StampedParcelScreenProps) {
  return (
    <ScreenFrame>
      <DarkStage
        box={<TapedCubeDisplay tapes={tapes} variant={variant} stamp={stamp} />}
        footerDisabled={apiBusy}
        footerButton={stamp === 'ok' ? '보관함으로 돌아가기' : '발송하기'}
        onFooterPress={onPress}
        title="우표를 찍었어요!"
      />
      <SideParticleBurst />
      {apiMessage ? <Text style={styles.stageError}>{apiMessage}</Text> : null}
    </ScreenFrame>
  );
}

type AttachMessageScreenProps = {
  apiBusy: boolean;
  apiMessage: string;
  onAttach: () => void;
  onReplyChange: (value: string) => void;
  replyDraft: string;
};

export function AttachMessageScreen({
  apiBusy,
  apiMessage,
  onAttach,
  onReplyChange,
  replyDraft,
}: AttachMessageScreenProps) {
  return (
    <ScreenFrame>
      <View style={styles.darkStage}>
        <TopGlow />
        <Text style={[styles.stageTitle, styles.stageTitleStandalone]}>
          택배에 글을 부착해보세요
        </Text>
        <View style={styles.stageBoxWrap}>
          <ParcelTopCard />
        </View>
        <View style={styles.replyEditor}>
          <Text style={styles.replyLabel}>답장</Text>
          <TextInput
            multiline
            onChangeText={onReplyChange}
            placeholder="받은 편지에 답장을 적어보세요"
            placeholderTextColor="#8f8aa1"
            style={styles.replyInput}
            value={replyDraft}
          />
        </View>
        <ActionPill
          disabled={!replyDraft.trim() || apiBusy}
          label="송장 붙이기"
          onPress={onAttach}
        />
        {apiMessage ? <Text style={styles.stageError}>{apiMessage}</Text> : null}
      </View>
    </ScreenFrame>
  );
}

type LabelCompleteScreenProps = {
  apiBusy: boolean;
  apiMessage: string;
  onComplete: () => void;
  replyDraft: string;
};

export function LabelCompleteScreen({
  apiBusy,
  apiMessage,
  onComplete,
  replyDraft,
}: LabelCompleteScreenProps) {
  return (
    <ScreenFrame>
      <DarkStage
        box={<ShippingLabelCard body={replyDraft} />}
        footerDisabled={apiBusy}
        footerButton="작성완료"
        onFooterPress={onComplete}
      />
      {apiMessage ? <Text style={styles.stageError}>{apiMessage}</Text> : null}
    </ScreenFrame>
  );
}
