export type Step =
  | 'auth'
  | 'intro'
  | 'landing'
  | 'letter-entry'
  | 'loading-check'
  | 'pack-request'
  | 'sealed'
  | 'confession-stamped'
  | 'loading-send'
  | 'reply-locker'
  | 'reply-locker-detail'
  | 'locker-grid'
  | 'locker-detail'
  | 'tear-package'
  | 'opened'
  | 'letter-read'
  | 'attach-message'
  | 'label-complete'
  | 'repack-prompt'
  | 'result-ok';

export type BoxVariant =
  | 'plain'
  | 'taped'
  | 'label'
  | 'label-taped'
  | 'open'
  | 'grid';

export type AutoStep = 'loading-check' | 'loading-send';

export type TapeData = {
  face: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type TapeWrapGroup = TapeData[];

export type ReceivedLockerParcel = {
  createdAt: string;
  fromNickname?: string;
  id: string;
  message: string;
  tapes: TapeData[];
  toNickname?: string;
};
