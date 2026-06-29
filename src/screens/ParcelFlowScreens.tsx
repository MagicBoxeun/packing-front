import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';

import {
  ActionPill,
  DarkStage,
  ScreenFrame,
  TopGlow,
} from '../components/common';
import { Barcode, BoxImg, ShippingLabelCard } from '../components/parcel';
import { InteractivePeelStage } from '../features/tape/InteractivePeelStage';
import { TapedCubeDisplay } from '../features/tape/TapedCubeDisplay';
import { styles } from '../styles';
import { TapeData, TapeWrapGroup } from '../types';

const SIDE_BURST_COLORS = [
  '#ffffff',
  '#f6f1ff',
  '#eadfff',
  '#d8c8ff',
  '#cbd8ff',
  '#bfe6ff',
  '#eaf7ff',
];

const SIDE_BURST_PATHS = [
  { delay: 0, dx: 118, dy: -132, size: 5, y: '32%' },
  { delay: 8, dx: 146, dy: -106, size: 7, y: '35%' },
  { delay: 16, dx: 176, dy: -78, size: 5, y: '38%' },
  { delay: 24, dx: 210, dy: -48, size: 8, y: '41%' },
  { delay: 32, dx: 136, dy: -38, size: 4, y: '44%' },
  { delay: 40, dx: 232, dy: -14, size: 6, y: '46%' },
  { delay: 48, dx: 164, dy: 8, size: 5, y: '48%' },
  { delay: 56, dx: 258, dy: 24, size: 7, y: '50%' },
  { delay: 64, dx: 126, dy: 42, size: 6, y: '52%' },
  { delay: 72, dx: 198, dy: 58, size: 4, y: '54%' },
  { delay: 80, dx: 276, dy: 76, size: 6, y: '56%' },
  { delay: 88, dx: 152, dy: 92, size: 8, y: '58%' },
  { delay: 96, dx: 224, dy: 112, size: 5, y: '60%' },
  { delay: 104, dx: 178, dy: 136, size: 6, y: '62%' },
  { delay: 112, dx: 252, dy: 154, size: 4, y: '64%' },
  { delay: 120, dx: 106, dy: 112, size: 5, y: '66%' },
  { delay: 128, dx: 202, dy: 176, size: 7, y: '68%' },
  { delay: 136, dx: 282, dy: 132, size: 5, y: '70%' },
  { delay: 144, dx: 142, dy: -172, size: 4, y: '30%' },
  { delay: 152, dx: 236, dy: -146, size: 6, y: '33%' },
  { delay: 160, dx: 288, dy: -92, size: 4, y: '37%' },
  { delay: 168, dx: 304, dy: -30, size: 5, y: '43%' },
  { delay: 176, dx: 310, dy: 36, size: 4, y: '49%' },
  { delay: 184, dx: 296, dy: 98, size: 6, y: '55%' },
  { delay: 192, dx: 270, dy: 188, size: 5, y: '61%' },
  { delay: 200, dx: 220, dy: 222, size: 4, y: '67%' },
  { delay: 208, dx: 166, dy: 204, size: 5, y: '72%' },
  { delay: 216, dx: 116, dy: 168, size: 4, y: '74%' },
  { delay: 224, dx: 246, dy: -206, size: 5, y: '29%' },
  { delay: 232, dx: 318, dy: 158, size: 4, y: '71%' },
];

const SIDE_BURST_PARTICLES = SIDE_BURST_PATHS.flatMap((particle, index) => [
  {
    ...particle,
    color: SIDE_BURST_COLORS[index % SIDE_BURST_COLORS.length],
    x: '0%',
  },
  {
    ...particle,
    color: SIDE_BURST_COLORS[(index + 3) % SIDE_BURST_COLORS.length],
    delay: particle.delay + 10,
    dx: -particle.dx,
    x: '100%',
  },
]);

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

function ReplyLabelEditor({
  fromNickname,
  onReplyChange,
  replyDraft,
  toNickname,
}: {
  fromNickname?: string;
  onReplyChange: (value: string) => void;
  replyDraft: string;
  toNickname?: string;
}) {
  return (
    <View style={styles.attachLabelCard}>
      <View style={styles.attachLabelHeader}>
        <Barcode />
        <Text style={styles.attachLabelTitle}>송장번호</Text>
        <Barcode />
      </View>
      <View style={styles.attachLabelInfo}>
        <Text style={styles.attachLabelSmall}>from. {fromNickname ?? ''}</Text>
        <Text style={styles.attachLabelSmall}>to. {toNickname ?? ''}</Text>
      </View>
      <View style={styles.attachMemoBox}>
        <View style={styles.attachMemoTag}>
          <Text style={styles.attachMemoTagText}>{'내\n용'}</Text>
        </View>
        <TextInput
          multiline
          onChangeText={onReplyChange}
          placeholder="받은 편지에 답장을 적어보세요"
          placeholderTextColor="#8d8880"
          style={styles.attachReplyInput}
          value={replyDraft}
        />
      </View>
    </View>
  );
}

type TearPackageScreenProps = {
  apiMessage: string;
  onPeeled: (remaining: number) => void;
  onPutBack: (remaining: number) => void;
  onRemainingChange: (remaining: number) => void;
  wrapGroups: TapeWrapGroup[];
};

export function TearPackageScreen({
  apiMessage,
  onPeeled,
  onPutBack,
  onRemainingChange,
  wrapGroups,
}: TearPackageScreenProps) {
  return (
    <ScreenFrame>
      <InteractivePeelStage
        boxVariant="label"
        onPeeled={onPeeled}
        onPutBack={onPutBack}
        onRemainingChange={onRemainingChange}
        title="소포를 뜯어주세요!"
        wrapGroups={wrapGroups}
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
  fromNickname?: string;
  onAttach: () => void;
  onReplyChange: (value: string) => void;
  replyDraft: string;
  toNickname?: string;
};

export function AttachMessageScreen({
  apiBusy,
  apiMessage,
  fromNickname,
  onAttach,
  onReplyChange,
  replyDraft,
  toNickname,
}: AttachMessageScreenProps) {
  return (
    <ScreenFrame>
      <View style={styles.attachStage}>
        <TopGlow />
        <Text style={styles.attachTitle}>택배에 글을 부착해보세요</Text>
        <View style={styles.attachScene}>
          <View style={styles.attachBoxWrap}>
            <BoxImg variant="plain" size={276} />
          </View>
          <ReplyLabelEditor
            fromNickname={fromNickname}
            onReplyChange={onReplyChange}
            replyDraft={replyDraft}
            toNickname={toNickname}
          />
        </View>
        <ActionPill
          disabled={!replyDraft.trim() || apiBusy}
          label="송장 붙이기"
          onPress={onAttach}
        />
        {apiMessage ? (
          <Text style={styles.stageError}>{apiMessage}</Text>
        ) : null}
      </View>
    </ScreenFrame>
  );
}

type LabelCompleteScreenProps = {
  apiBusy: boolean;
  apiMessage: string;
  fromNickname?: string;
  onComplete: () => void;
  replyDraft: string;
  toNickname?: string;
};

export function LabelCompleteScreen({
  apiBusy,
  apiMessage,
  fromNickname,
  onComplete,
  replyDraft,
  toNickname,
}: LabelCompleteScreenProps) {
  return (
    <ScreenFrame>
      <DarkStage
        box={
          <ShippingLabelCard
            body={replyDraft}
            from={fromNickname}
            to={toNickname}
          />
        }
        footerDisabled={apiBusy}
        footerButton="작성완료"
        onFooterPress={onComplete}
      />
      {apiMessage ? <Text style={styles.stageError}>{apiMessage}</Text> : null}
    </ScreenFrame>
  );
}
