import React, { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Image,
  ImageBackground as RNImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// 이 프로젝트의 jest preset은 Animated를 노출하지 않는다. 테스트에선 no-op 셰임.
const Animated: any =
  RNAnimated && RNAnimated.Value
    ? RNAnimated
    : {
        Value: class {
          setValue() {}
        },
        timing: () => ({ start: () => {} }),
        View,
        Text,
      };

const ImageBackground: any = RNImageBackground ?? View;

const win = Dimensions?.get?.('window') ?? { width: 390, height: 844 };
const W = win.width || 390;
const H = win.height || 844;
const GLOW = require('../../assets/intro-glow.png');
const GLOW_SPY = require('../../assets/intro-glow-spy.png');
const SPY = require('../../assets/intro-spy.png');

const SPY_W = W * 0.41;
const SPY_H = SPY_W * (800 / 475); // 원본 비율 유지

type Panel =
  | { kind: 'text'; lines: string[] }
  | { kind: 'dots'; lines: string[] }
  | { kind: 'title' }
  | { kind: 'spy'; lines: string[] }
  | { kind: 'solid'; lines: string[] };

const PANELS: Panel[] = [
  { kind: 'text', lines: ['아무도 모르지만,', '당신은 사실'] },
  { kind: 'dots', lines: ['아무도 모르지만,', '당신은 사실'] },
  { kind: 'title' },
  { kind: 'spy', lines: ['당신의 목표는 이 택배회사의', '택배의 질을 떨어뜨려'] },
  { kind: 'spy', lines: ['망하게 하는 것입니다!'] },
  { kind: 'solid', lines: ['임무를 잘 완수해주세요...'] },
];

const hasSpy = (p: Panel) => p.kind === 'title' || p.kind === 'spy';

// "..."을 하나씩 시간차로 노출 (인라인).
function Dots() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const timers = dots.map((v, i) =>
      setTimeout(() => {
        Animated.timing(v, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }, 320 * (i + 1)),
    );
    return () => timers.forEach(clearTimeout);
  }, [dots]);
  return (
    <>
      {dots.map((v, i) => (
        <Animated.Text key={i} style={{ opacity: v }}>
          .
        </Animated.Text>
      ))}
    </>
  );
}

function PanelBody({ panel }: { panel: Panel }) {
  if (panel.kind === 'title') {
    return (
      <Text style={styles.body}>
        <Text style={styles.titleRed}>산업스파이</Text>
        <Text> 입니다!</Text>
      </Text>
    );
  }
  const last = panel.lines.length - 1;
  return (
    <View style={styles.textBlock}>
      {panel.lines.map((line, i) => (
        <Text key={i} style={styles.body}>
          {line}
          {panel.kind === 'dots' && i === last ? <Dots /> : null}
        </Text>
      ))}
    </View>
  );
}

export function IntroScreen({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setHidden?.(true, 'fade');
    return () => {
      StatusBar.setHidden?.(false, 'fade');
    };
  }, []);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [idx, fade]);

  const next = () => {
    if (idx >= PANELS.length - 1) {
      onDone();
    } else {
      setIdx(idx + 1);
    }
  };

  const panel = PANELS[idx];

  const inner = (
    <>
      <Animated.View
        style={[
          styles.panel,
          hasSpy(panel) ? styles.panelTop : styles.panelCenter,
          { opacity: fade },
        ]}
      >
        <PanelBody panel={panel} />
      </Animated.View>
      {hasSpy(panel) ? (
        <Image source={SPY} style={styles.spy} resizeMode="contain" />
      ) : null}
    </>
  );

  return (
    <Pressable style={styles.root} onPress={next}>
      <StatusBar hidden />
      {panel.kind === 'solid' ? (
        <View style={[styles.fill, styles.solid]}>{inner}</View>
      ) : (
        <ImageBackground
          source={hasSpy(panel) ? GLOW_SPY : GLOW}
          style={styles.fill}
          resizeMode="cover"
        >
          {inner}
        </ImageBackground>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0523' },
  fill: { flex: 1 },
  solid: { backgroundColor: '#08031f' },
  panel: { flex: 1, alignItems: 'center' },
  panelCenter: { justifyContent: 'center' },
  panelTop: { justifyContent: 'flex-start', paddingTop: H * 0.18 },
  textBlock: { alignItems: 'center' },
  body: {
    fontFamily: 'Cafe24PROSlim-Light',
    fontSize: W * 0.041,
    lineHeight: W * 0.061,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  titleRed: {
    fontFamily: 'GraceSerif',
    fontSize: W * 0.078,
    color: '#af0202',
  },
  spy: {
    position: 'absolute',
    top: H * 0.34,
    alignSelf: 'center',
    width: SPY_W,
    height: SPY_H,
  },
});
