import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { styles } from '../styles';

export function ScreenFrame({
  background,
  children,
}: {
  background?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.phoneFrame}>
      {background}
      <SafeAreaView style={styles.safeAreaContent}>{children}</SafeAreaView>
    </View>
  );
}

export function DarkStage({
  accent,
  accentDone,
  bottomElement,
  box,
  footerDisabled,
  footerButton,
  helper,
  onBoxPress,
  onFooterPress,
  title,
}: {
  accent?: string;
  accentDone?: boolean;
  bottomElement?: React.ReactNode;
  box: React.ReactNode;
  footerDisabled?: boolean;
  footerButton?: string;
  helper?: string;
  onBoxPress?: () => void;
  onFooterPress?: () => void;
  title?: string;
}) {
  return (
    <View style={styles.darkStage}>
      <TopGlow />
      {title ? (
        <View style={styles.stageTitleRow}>
          <Text style={styles.stageTitle}>{title}</Text>
          {accent ? (
            <Text
              style={[styles.stageAccent, !accentDone && { color: '#f7f6fb' }]}
            >
              {accent}
            </Text>
          ) : null}
        </View>
      ) : null}
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
      {onBoxPress ? (
        <Pressable onPress={onBoxPress} style={styles.stageBoxWrap}>
          {box}
        </Pressable>
      ) : (
        <View style={styles.stageBoxWrap}>{box}</View>
      )}
      {bottomElement ? (
        <View style={styles.stageBottomElement}>{bottomElement}</View>
      ) : null}
      {footerButton ? (
        <ActionGhost
          disabled={footerDisabled}
          label={footerButton}
          onPress={onFooterPress}
        />
      ) : null}
    </View>
  );
}

export function GlowLoading({ text }: { text: string }) {
  return (
    <View style={styles.darkStage}>
      <TopGlow />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

export function WarehouseBackground({
  variant = 'conveyor',
}: {
  variant?: 'conveyor' | 'home';
}) {
  return (
    <Image
      resizeMode="cover"
      source={
        variant === 'home'
          ? require('../../assets/home-background.png')
          : require('../../assets/conveyor-background.png')
      }
      style={styles.bgImage}
    />
  );
}

const GRADIENT_HTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/><style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:radial-gradient(ellipse 309px 152px at 50% 50%,#52505a 0%,#403d4d 25%,#2e2a3f 50%,#1c1831 75%,#0a0523 100%)}</style></head><body></body></html>`;

export function TopGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <WebView
        source={{ html: GRADIENT_HTML }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        opaque={false}
      />
    </View>
  );
}

export function TopBackLabel({
  boxed,
  label,
  onBack,
}: {
  boxed?: boolean;
  label: string;
  onBack?: () => void;
}) {
  const content = (
    <View style={styles.topBackRow}>
      {onBack ? <Text style={styles.backArrow}>{'<'}</Text> : null}
      {boxed ? <View style={styles.boxedIcon} /> : null}
      <Text style={styles.topBackLabel}>{label}</Text>
    </View>
  );
  if (!onBack) {
    return content;
  }
  return (
    <Pressable accessibilityLabel="뒤로" hitSlop={10} onPress={onBack}>
      {content}
    </Pressable>
  );
}

export function ActionPill({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.actionPill, disabled && styles.actionGhostDisabled]}
    >
      <Text style={styles.actionPillText}>{label}</Text>
    </Pressable>
  );
}

export function ActionGhost({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.actionGhost, disabled && styles.actionGhostDisabled]}
    >
      <Text style={styles.actionGhostText}>{label}</Text>
    </Pressable>
  );
}
