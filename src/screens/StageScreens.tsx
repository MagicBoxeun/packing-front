import React from 'react';

import { DarkStage, GlowLoading, ScreenFrame } from '../components/common';
import { BoxImg } from '../components/parcel';
import { InteractiveTapeStage } from '../features/tape/InteractiveTapeStage';
import { TapedCubeDisplay } from '../features/tape/TapedCubeDisplay';
import { BoxVariant, TapeData } from '../types';

type LoadingScreenProps = {
  text: string;
};

export function LoadingScreen({ text }: LoadingScreenProps) {
  return (
    <ScreenFrame>
      <GlowLoading text={text} />
    </ScreenFrame>
  );
}

type TapePackingScreenProps = {
  boxVariant: BoxVariant;
  onFinish: (tapes: TapeData[]) => void;
  title: string;
};

export function TapePackingScreen({
  boxVariant,
  onFinish,
  title,
}: TapePackingScreenProps) {
  return (
    <ScreenFrame>
      <InteractiveTapeStage
        boxVariant={boxVariant}
        onFinish={onFinish}
        title={title}
      />
    </ScreenFrame>
  );
}

type SealedScreenProps = {
  onContinue: () => void;
  tapes: TapeData[];
};

export function SealedScreen({ onContinue, tapes }: SealedScreenProps) {
  return (
    <ScreenFrame>
      <DarkStage
        box={<TapedCubeDisplay tapes={tapes} variant="plain" />}
        footerButton="계속"
        onFooterPress={onContinue}
        title="포장이 끝났어요!"
      />
    </ScreenFrame>
  );
}

type OpenedParcelScreenProps = {
  onReadLetter: () => void;
};

export function OpenedParcelScreen({ onReadLetter }: OpenedParcelScreenProps) {
  return (
    <ScreenFrame>
      <DarkStage
        box={<BoxImg variant="open" />}
        footerButton="편지 보기"
        onFooterPress={onReadLetter}
      />
    </ScreenFrame>
  );
}
