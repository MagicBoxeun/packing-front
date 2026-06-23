import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { TAPE_SOUND_BASE64 } from '../../../tapeSound';
import { TopGlow } from '../../components/common';
import { styles } from '../../styles';
import { BoxVariant, TapeData } from '../../types';
import { cubeHtml, MAX_TAPES } from './cubeHtml';

export function InteractiveTapeStage({
  boxVariant,
  onFinish,
}: {
  boxVariant: BoxVariant;
  onFinish: (tapes: TapeData[]) => void;
  title: string;
}) {
  const [tapeCount, setTapeCount] = useState(0);
  const tapesRef = useRef<TapeData[]>([]);
  const html = useMemo(
    () => cubeHtml(boxVariant, TAPE_SOUND_BASE64),
    [boxVariant],
  );
  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data) as {
        count?: number;
        tapes?: TapeData[];
      };
      if (typeof parsed.count === 'number') {
        setTapeCount(Math.min(parsed.count, MAX_TAPES));
      }
      if (Array.isArray(parsed.tapes)) {
        tapesRef.current = parsed.tapes;
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.tapeScreen}>
      <TopGlow />
      <View style={styles.tapeWebViewWrap}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          onMessage={handleMessage}
          style={styles.tapeWebView}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          opaque={false}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
        />
      </View>

      <Pressable
        disabled={tapeCount === 0}
        onPress={() => onFinish(tapesRef.current)}
        style={[
          styles.tapeCompleteButton,
          tapeCount === 0 && styles.actionGhostDisabled,
        ]}
      >
        <Text style={styles.tapeCompleteText}>포장완료</Text>
      </Pressable>
    </View>
  );
}
