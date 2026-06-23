import { ParcelFeedItem } from '../api';
import { Step } from './types';

export const DARK = '#09041f';
export const PAPER = '#fbf4e4';
export const PAPER_LINE = '#d2d0c9';

// Dev preview toggle: set to a Step to force-render that screen (null = normal flow).
export const DEV_STEP: Step | null = null;

export const FALLBACK_PACKAGES: ParcelFeedItem[] = [
  {
    id: 'preview-0',
    nickname: '용감한 코알라',
    tagline: '비밀 배송',
  },
];

export const BELT_ITEM_WIDTH = 160;
