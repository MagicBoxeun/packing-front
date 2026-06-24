import { TapeData, TapeWrapGroup } from '../../types';
import { MAX_TAPES } from './cubeHtml';

const SIDE = 150;
const HALF = SIDE / 2;
const TAPE_W = 30;
const EDGE = HALF;
const LANE_MAX = HALF - TAPE_W / 2;
const LANES = [-0.62, -0.32, 0, 0.32, 0.62];

type ApiTapeSource = {
  tapeWraps?: TapeWrapGroup[];
  tapes?: TapeData[];
};

function hashString(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function addStrip(
  group: TapeWrapGroup,
  face: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  group.push({ face, x1, y1, x2, y2 });
}

export function wrapCountForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return 3 + (Math.abs(hash) % 5);
}

export function buildTapeWrapsForParcel(
  parcelId: string,
  wrapCount = wrapCountForId(parcelId),
): TapeWrapGroup[] {
  const safeCount = Math.max(0, Math.min(wrapCount, MAX_TAPES));
  const random = seededRandom(parcelId);
  const wraps: TapeWrapGroup[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    const group: TapeWrapGroup = [];
    const laneIndex = (i + Math.floor(random() * LANES.length)) % LANES.length;
    const lane = LANES[laneIndex] * LANE_MAX;
    const r = random();

    if (r < 0.42) {
      addStrip(group, 'front', lane, -EDGE, lane, EDGE);
      addStrip(group, 'top', lane, -EDGE, lane, EDGE);
      addStrip(group, 'back', -lane, -EDGE, -lane, EDGE);
    } else if (r < 0.72) {
      addStrip(group, 'front', -EDGE, lane, EDGE, lane);
      addStrip(group, 'right', -EDGE, lane, EDGE, lane);
      addStrip(group, 'back', -EDGE, lane, EDGE, lane);
      addStrip(group, 'left', -EDGE, lane, EDGE, lane);
    } else {
      const dir = random() < 0.5 ? 1 : -1;
      const d = dir * (11 + random() * 7);
      let y = lane * 0.5 - 1.5 * d;
      ['front', 'right', 'back', 'left'].forEach(face => {
        addStrip(group, face, -EDGE, y, EDGE, y + d);
        y += d;
      });
    }

    wraps.push(group);
  }

  return wraps;
}

export function flattenTapeWraps(wraps: TapeWrapGroup[]): TapeData[] {
  return wraps.flat();
}

export function tapeWrapsFromApi(
  source?: ApiTapeSource,
): TapeWrapGroup[] | null {
  if (Array.isArray(source?.tapeWraps)) {
    return source.tapeWraps;
  }
  if (Array.isArray(source?.tapes)) {
    return [source.tapes];
  }
  return null;
}
