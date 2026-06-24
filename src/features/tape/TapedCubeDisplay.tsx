import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { styles } from '../../styles';
import { BoxVariant, TapeData } from '../../types';
import { displayCubeHtml } from './cubeHtml';

export function TapedCubeDisplay({
  disableSpin = false,
  modelScale = 1.05,
  size = 248,
  stamp,
  tapes,
  variant,
}: {
  disableSpin?: boolean;
  modelScale?: number;
  size?: number;
  stamp?: 'confession' | 'ok';
  tapes: TapeData[];
  variant: BoxVariant;
}) {
  const html = useMemo(
    () => displayCubeHtml(variant, tapes, stamp, disableSpin, modelScale),
    [variant, tapes, stamp, disableSpin, modelScale],
  );
  return (
    <View style={{ height: size, width: size }}>
      <WebView
        source={{ html }}
        style={{
          backgroundColor: 'transparent',
          height: '100%',
          width: '100%',
        }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        opaque={false}
      />
      {stamp === 'confession' ? (
        <Image
          resizeMode="contain"
          source={require('../../../assets/stamp-confession.png')}
          style={[
            styles.stampOverlay,
            { height: size * 0.55, width: size * 0.55 },
          ]}
        />
      ) : null}
      {stamp === 'ok' ? (
        <Image
          resizeMode="contain"
          source={require('../../../assets/stamp-ok.png')}
          style={[
            styles.stampOverlay,
            { height: size * 0.6, width: size * 0.6 },
          ]}
        />
      ) : null}
    </View>
  );
}
