import React, { useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { TAPE_SOUND_BASE64 } from '../../../tapeSound';
import { TopGlow } from '../../components/common';
import { styles } from '../../styles';
import { BoxVariant, TapeWrapGroup } from '../../types';
import { peelCubeHtml } from './cubeHtml';

// A single receiver may peel the box at most this many times. How many bands the
// box is actually wrapped with stays hidden — only the tap allowance is shown.
const MAX_PEELS = 3;

export function InteractivePeelStage({
  boxVariant,
  helper,
  onPeeled,
  onPutBack,
  onRemainingChange,
  title,
  wrapGroups,
}: {
  boxVariant: BoxVariant;
  helper?: string;
  onPeeled: (remaining: number) => void;
  onPutBack: (remaining: number) => void;
  onRemainingChange: (remaining: number) => void;
  title: string;
  wrapGroups: TapeWrapGroup[];
}) {
  // Lock the tape layout to the first render so peeling doesn't reload the WebView.
  const initialWrapGroups = useRef(wrapGroups).current;
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_PEELS);
  const doneRef = useRef(false);
  const html = useMemo(
    () => peelCubeHtml(boxVariant, initialWrapGroups, TAPE_SOUND_BASE64, MAX_PEELS),
    [boxVariant, initialWrapGroups],
  );

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data) as {
        remaining?: number;
        attemptsLeft?: number;
        done?: boolean;
        exhausted?: boolean;
      };
      if (typeof parsed.attemptsLeft === 'number') {
        setAttemptsLeft(parsed.attemptsLeft);
      }
      if (typeof parsed.remaining === 'number') {
        onRemainingChange(parsed.remaining);
      }
      if (parsed.done && !doneRef.current) {
        doneRef.current = true;
        onPeeled(parsed.remaining ?? 0);
      } else if (parsed.exhausted && !doneRef.current) {
        // Out of taps but still wrapped -> back to the conveyor it goes.
        doneRef.current = true;
        onPutBack(parsed.remaining ?? 0);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.tapeScreen}>
      <TopGlow />
      <View style={[styles.stageTitleRow, styles.stageTitleStandalone]}>
        <Text style={styles.stageTitle}>{title} </Text>
        <Text
          style={[
            styles.stageAccent,
            attemptsLeft > 0 && { color: '#f7f6fb' },
          ]}
        >
          ({MAX_PEELS - attemptsLeft}/{MAX_PEELS})
        </Text>
      </View>
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
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
    </View>
  );
}
