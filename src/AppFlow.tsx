import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthSession, PackingApi, ParcelCreated, ParcelFeedItem } from '../api';
import { DARK, DEV_STEP, FALLBACK_PACKAGES } from './constants';
import { AuthScreen } from './screens/AuthScreen';
import { IntroScreen } from './screens/IntroScreen';
import { LandingScreen } from './screens/LandingScreen';
import { LetterComposeScreen, LetterReadScreen } from './screens/LetterScreens';
import {
  LockerDetailScreen,
  LockerGridScreen,
  ReplyLockerDetailScreen,
  ReplyLockerScreen,
} from './screens/LockerScreens';
import {
  AttachMessageScreen,
  LabelCompleteScreen,
  StampedParcelScreen,
  TearPackageScreen,
} from './screens/ParcelFlowScreens';
import {
  LoadingScreen,
  OpenedParcelScreen,
  SealedScreen,
  TapePackingScreen,
} from './screens/StageScreens';
import { styles } from './styles';
import {
  buildTapeWrapsForParcel,
  tapeWrapsFromApi,
} from './features/tape/tapeWraps';
import {
  AutoStep,
  ReceivedLockerParcel,
  Step,
  TapeData,
  TapeWrapGroup,
} from './types';

function isOwnParcel(
  pkg: ParcelFeedItem,
  auth: AuthSession | null,
  createdParcel: ParcelCreated | null,
) {
  if (createdParcel?.id === pkg.id) {
    return true;
  }
  if (!auth) {
    return false;
  }
  const ownerId = pkg.authorId ?? pkg.userId ?? pkg.ownerId ?? pkg.senderId;
  return ownerId === auth.user.id;
}

function tapeWrapsForParcel(
  pkg: ParcelFeedItem,
  remainingById: Record<string, number>,
): TapeWrapGroup[] {
  const originalWraps = originalTapeWrapsForParcel(pkg);
  const remaining = remainingById[pkg.id];
  return typeof remaining === 'number'
    ? originalWraps.slice(0, remaining)
    : originalWraps;
}

function originalTapeWrapsForParcel(pkg: ParcelFeedItem): TapeWrapGroup[] {
  return tapeWrapsFromApi(pkg) ?? buildTapeWrapsForParcel(pkg.id);
}

function remainingTapeWrapsForParcel(
  pkg: ParcelFeedItem,
  remaining: number,
): TapeWrapGroup[] {
  return originalTapeWrapsForParcel(pkg).slice(0, Math.max(0, remaining));
}

export default function AppFlow() {
  const insets = useSafeAreaInsets();
  const apiRef = useRef(new PackingApi());
  const skipNextFeedRefreshRef = useRef(false);
  // 인트로(산업 스파이)는 첫 로그인 1회만. 로그아웃 후 재로그인 시엔 생략.
  const introSeenRef = useRef(false);
  const [stepState, setStep] = useState<Step>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [emailDraft, setEmailDraft] = useState('');
  const [passwordDraft, setPasswordDraft] = useState('');
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const step = DEV_STEP ?? (!auth && stepState !== 'auth' ? 'auth' : stepState);
  const [messageDraft, setMessageDraft] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [selectedPackageState, setSelectedPackage] = useState<string | null>(
    null,
  );
  const [feedPackages, setFeedPackages] = useState<ParcelFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [openedContent, setOpenedContent] = useState('');
  const [createdParcel, setCreatedParcel] = useState<ParcelCreated | null>(
    null,
  );
  const [apiBusy, setApiBusy] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [peelRemaining, setPeelRemaining] = useState<Record<string, number>>(
    {},
  );
  const [packedTapes, setPackedTapes] = useState<TapeData[]>([]);
  const [receivedLockerParcels, setReceivedLockerParcels] = useState<
    ReceivedLockerParcel[]
  >([]);
  const [receivedLockerLoading, setReceivedLockerLoading] = useState(false);
  const [selectedReplyParcelId, setSelectedReplyParcelId] = useState<
    string | null
  >(null);
  const displayPackages = useMemo(
    () =>
      (DEV_STEP ? FALLBACK_PACKAGES : feedPackages).filter(
        pkg => !isOwnParcel(pkg, auth, createdParcel),
      ),
    [auth, createdParcel, feedPackages],
  );
  const selectedPackage = DEV_STEP
    ? displayPackages[0]?.id ?? null
    : selectedPackageState;
  const selectedParcel = selectedPackage
    ? displayPackages.find(pkg => pkg.id === selectedPackage) ?? null
    : null;
  const selectedReplyParcel = selectedReplyParcelId
    ? receivedLockerParcels.find(
        parcel => parcel.id === selectedReplyParcelId,
      ) ?? null
    : null;

  useEffect(() => {
    if (!auth && step !== 'auth' && !DEV_STEP) {
      setStep('auth');
    }
  }, [auth, step]);

  useEffect(() => {
    const autoAdvanceMap: Record<AutoStep, Step> = {
      'loading-check': 'pack-request',
      'loading-send': 'locker-grid',
    };

    if (step !== 'loading-check' && step !== 'loading-send') {
      return;
    }

    const timeout = setTimeout(() => {
      setStep(autoAdvanceMap[step]);
    }, 1400);

    return () => clearTimeout(timeout);
  }, [step]);

  const goTo = (nextStep: Step) => {
    setApiMessage('');
    setStep(nextStep);
  };

  const resetFlow = useCallback(() => {
    setStep('landing');
    setSelectedPackage(null);
    setPeelRemaining({});
    setMessageDraft('');
    setReplyDraft('');
    setOpenedContent('');
    setCreatedParcel(null);
    setPackedTapes([]);
    setSelectedReplyParcelId(null);
    setApiMessage('');
  }, []);

  const startNewConfession = () => {
    setSelectedPackage(null);
    setMessageDraft('');
    setReplyDraft('');
    setOpenedContent('');
    setCreatedParcel(null);
    setPackedTapes([]);
    setSelectedReplyParcelId(null);
    setApiMessage('');
    setStep('letter-entry');
  };

  const handleAuth = useCallback(async () => {
    const email = emailDraft.trim();
    const password = passwordDraft;
    if (!email || password.length < 8) {
      setApiMessage('이메일과 8자 이상 비밀번호를 입력해주세요.');
      return;
    }

    setApiBusy(true);
    setApiMessage('');
    try {
      if (authMode === 'signup') {
        // 가입만 처리하고 자동 로그인하지 않는다. 로그인 모드로 전환 후 직접 로그인.
        await apiRef.current.signup(email, password);
        apiRef.current.setTokens(null, null);
        setAuthMode('login');
        setPasswordDraft('');
        setApiMessage('가입이 완료됐어요. 로그인해주세요.');
        return;
      }

      const nextAuth = await apiRef.current.login(email, password);
      setAuth(nextAuth);
      if (introSeenRef.current) {
        setStep('landing');
      } else {
        introSeenRef.current = true;
        setStep('intro');
      }
    } catch (error) {
      setApiMessage(
        error instanceof Error ? error.message : '인증에 실패했어요.',
      );
    } finally {
      setApiBusy(false);
    }
  }, [authMode, emailDraft, passwordDraft]);

  const handleLogout = useCallback(async () => {
    setApiBusy(true);
    setApiMessage('');
    try {
      await apiRef.current.logout();
    } catch {
      apiRef.current.setTokens(null, null);
    } finally {
      setAuth(null);
      setAuthMode('login');
      setEmailDraft('');
      setPasswordDraft('');
      setSelectedPackage(null);
      setFeedPackages([]);
      setFeedLoading(false);
      setReceivedLockerLoading(false);
      setMessageDraft('');
      setReplyDraft('');
      setOpenedContent('');
      setCreatedParcel(null);
      setPeelRemaining({});
      setPackedTapes([]);
      setReceivedLockerParcels([]);
      setSelectedReplyParcelId(null);
      setApiMessage('');
      setApiBusy(false);
      setStep('auth');
    }
  }, []);

  const refreshFeed = useCallback(async () => {
    if (!auth) {
      return;
    }

    setFeedLoading(true);
    setApiMessage('');
    try {
      const page = await apiRef.current.getFeed(10);
      setFeedPackages(page.items);
    } catch (error) {
      setApiMessage(
        error instanceof Error
          ? error.message
          : '택배 목록을 불러오지 못했어요.',
      );
    } finally {
      setFeedLoading(false);
    }
  }, [auth]);

  const refreshReceivedReplies = useCallback(async () => {
    if (!auth) {
      return;
    }

    setReceivedLockerLoading(true);
    setApiMessage('');
    try {
      const replies = await apiRef.current.getReceivedReplies();
      setReceivedLockerParcels(replies);
    } catch (error) {
      setApiMessage(
        error instanceof Error
          ? error.message
          : '받은 답장 택배를 불러오지 못했어요.',
      );
    } finally {
      setReceivedLockerLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    if (step === 'locker-grid') {
      if (skipNextFeedRefreshRef.current) {
        skipNextFeedRefreshRef.current = false;
        return;
      }
      refreshFeed();
    }
  }, [refreshFeed, step]);

  useEffect(() => {
    if (step === 'reply-locker') {
      refreshReceivedReplies();
    }
  }, [refreshReceivedReplies, step]);

  const applyParcelTapeWraps = useCallback(
    (parcelId: string, tapeWraps: TapeWrapGroup[]) => {
      setFeedPackages(prev =>
        prev.map(pkg =>
          pkg.id === parcelId ? { ...pkg, tapeWraps, tapes: undefined } : pkg,
        ),
      );
    },
    [],
  );

  const handleCreateParcel = useCallback(async () => {
    if (!auth || messageDraft.trim().length < 10) {
      setApiMessage('고해성사는 10자 이상 적어주세요.');
      return;
    }

    const content = messageDraft.trim();
    const firstLine = content.split('\n').find(Boolean)?.trim();
    const tagline = (firstLine || '비밀 배송').slice(0, 30);

    setApiBusy(true);
    setApiMessage('');
    try {
      const parcel = await apiRef.current.createParcel({
        nickname: auth.user.nickname,
        tagline,
        content,
        tapes: packedTapes,
      });
      setCreatedParcel(parcel);
      setMessageDraft('');
      goTo('loading-send');
    } catch (error) {
      setApiMessage(
        error instanceof Error ? error.message : '소포 발송에 실패했어요.',
      );
    } finally {
      setApiBusy(false);
    }
  }, [auth, messageDraft, packedTapes]);

  const handleOpenParcel = useCallback(
    async (tapeWraps?: TapeWrapGroup[]) => {
      if (!selectedPackage) {
        setApiMessage('열 소포를 먼저 골라주세요.');
        return;
      }

      setApiBusy(true);
      setApiMessage('');
      try {
        const result = await apiRef.current.openParcel(
          selectedPackage,
          tapeWraps ? { tapeWraps } : undefined,
        );
        setOpenedContent(result.content);
        setTimeout(() => goTo('opened'), 250);
      } catch (error) {
        setApiMessage(
          error instanceof Error ? error.message : '소포를 열지 못했어요.',
        );
      } finally {
        setApiBusy(false);
      }
    },
    [selectedPackage],
  );

  const handleSendReply = useCallback(async () => {
    if (!selectedPackage || !replyDraft.trim()) {
      setApiMessage('답장을 입력해주세요.');
      return;
    }

    setApiBusy(true);
    setApiMessage('');
    try {
      await apiRef.current.sendReply(selectedPackage, replyDraft.trim());
      goTo('repack-prompt');
    } catch (error) {
      setApiMessage(
        error instanceof Error ? error.message : '답장 전송에 실패했어요.',
      );
    } finally {
      setApiBusy(false);
    }
  }, [replyDraft, selectedPackage]);

  const peelWrapGroups = selectedParcel
    ? tapeWrapsForParcel(selectedParcel, peelRemaining)
    : [];

  const handlePeelRemaining = useCallback(
    (remaining: number) => {
      if (!selectedPackage) {
        return;
      }
      setPeelRemaining(prev => ({ ...prev, [selectedPackage]: remaining }));
    },
    [selectedPackage],
  );

  const handlePutBackAfterPeel = useCallback(
    async (remaining: number) => {
      if (!selectedPackage || !selectedParcel) {
        goTo('locker-grid');
        return;
      }

      const tapeWraps = remainingTapeWrapsForParcel(selectedParcel, remaining);
      setPeelRemaining(prev => ({ ...prev, [selectedPackage]: remaining }));
      applyParcelTapeWraps(selectedPackage, tapeWraps);
      skipNextFeedRefreshRef.current = true;
      setApiBusy(true);
      setApiMessage('');
      try {
        const updatedParcel = await apiRef.current.updateParcelTapeWraps(
          selectedPackage,
          tapeWraps,
        );
        setFeedPackages(prev =>
          prev.map(pkg =>
            pkg.id === selectedPackage
              ? {
                  ...pkg,
                  ...updatedParcel,
                  tapeWraps: updatedParcel.tapeWraps ?? tapeWraps,
                }
              : pkg,
          ),
        );
      } catch (error) {
        setApiMessage(
          error instanceof Error
            ? error.message
            : '테이프 상태를 저장하지 못했어요.',
        );
      } finally {
        setApiBusy(false);
        setStep('locker-grid');
      }
    },
    [applyParcelTapeWraps, selectedPackage, selectedParcel],
  );

  const handlePeeledAll = useCallback(
    (remaining: number) => {
      if (!selectedPackage || !selectedParcel) {
        handleOpenParcel();
        return;
      }

      const tapeWraps = remainingTapeWrapsForParcel(selectedParcel, remaining);
      setPeelRemaining(prev => ({ ...prev, [selectedPackage]: remaining }));
      applyParcelTapeWraps(selectedPackage, tapeWraps);
      handleOpenParcel(tapeWraps);
    },
    [applyParcelTapeWraps, handleOpenParcel, selectedPackage, selectedParcel],
  );

  const letterContent =
    (selectedPackage !== null ? openedContent : messageDraft) ||
    createdParcel?.tagline ||
    ' ';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={DARK} />
      {step !== 'landing' && step !== 'auth' && step !== 'intro' ? (
        <Pressable
          accessibilityLabel="처음으로"
          onPress={resetFlow}
          style={[styles.resetButton, { top: insets.top + 6 }]}
        >
          <Text style={styles.resetButtonText}>RESET</Text>
        </Pressable>
      ) : null}

      {step === 'auth' ? (
        <AuthScreen
          apiBusy={apiBusy}
          apiMessage={apiMessage}
          authMode={authMode}
          emailDraft={emailDraft}
          passwordDraft={passwordDraft}
          onEmailChange={setEmailDraft}
          onPasswordChange={setPasswordDraft}
          onSubmit={handleAuth}
          onSwitchMode={() => {
            setApiMessage('');
            setAuthMode(mode => (mode === 'login' ? 'signup' : 'login'));
          }}
        />
      ) : null}

      {step === 'intro' ? <IntroScreen onDone={() => goTo('landing')} /> : null}

      {step === 'landing' ? (
        <LandingScreen
          apiBusy={apiBusy}
          onLogout={handleLogout}
          onOpenLocker={() => goTo('reply-locker')}
          onStealParcel={() => goTo('locker-grid')}
          onWriteConfession={startNewConfession}
        />
      ) : null}

      {step === 'letter-entry' ? (
        <LetterComposeScreen
          apiMessage={apiMessage}
          messageDraft={messageDraft}
          onDone={() => goTo('loading-check')}
          onMessageChange={setMessageDraft}
        />
      ) : null}

      {step === 'loading-check' ? (
        <LoadingScreen text="박스를 확인하는 중..." />
      ) : null}

      {step === 'pack-request' ? (
        <TapePackingScreen
          boxVariant="plain"
          onFinish={tapes => {
            setPackedTapes(tapes);
            goTo('sealed');
          }}
          title="포장해주세요!"
        />
      ) : null}

      {step === 'sealed' ? (
        <SealedScreen
          tapes={packedTapes}
          onContinue={() => goTo('confession-stamped')}
        />
      ) : null}

      {step === 'confession-stamped' ? (
        <StampedParcelScreen
          apiBusy={apiBusy}
          apiMessage={apiMessage}
          onPress={handleCreateParcel}
          stamp="confession"
          tapes={packedTapes}
          variant="plain"
        />
      ) : null}

      {step === 'loading-send' ? (
        <LoadingScreen text="소포를 집배원에게 주는 중,,,," />
      ) : null}

      {step === 'reply-locker' ? (
        <ReplyLockerScreen
          apiMessage={apiMessage}
          loading={receivedLockerLoading}
          parcels={receivedLockerParcels}
          onBack={() => goTo('landing')}
          onSelect={id => {
            setSelectedReplyParcelId(id);
            goTo('reply-locker-detail');
          }}
        />
      ) : null}

      {step === 'reply-locker-detail' ? (
        <ReplyLockerDetailScreen
          parcel={selectedReplyParcel}
          onBack={() => goTo('reply-locker')}
        />
      ) : null}

      {step === 'locker-grid' ? (
        <LockerGridScreen
          apiMessage={apiMessage}
          feedLoading={feedLoading}
          getTapeWraps={pkg => tapeWrapsForParcel(pkg, peelRemaining)}
          packages={displayPackages}
          onBack={() => goTo('landing')}
          onSelect={id => {
            setSelectedPackage(id);
            setOpenedContent('');
            goTo('locker-detail');
          }}
        />
      ) : null}

      {step === 'locker-detail' ? (
        <LockerDetailScreen
          getTapeWraps={pkg => tapeWrapsForParcel(pkg, peelRemaining)}
          selectedParcel={selectedParcel}
          onBack={() => goTo('locker-grid')}
          onOpen={() => goTo('tear-package')}
        />
      ) : null}

      {step === 'tear-package' ? (
        <TearPackageScreen
          apiMessage={apiMessage}
          onPeeled={handlePeeledAll}
          onPutBack={handlePutBackAfterPeel}
          onRemainingChange={handlePeelRemaining}
          wrapGroups={peelWrapGroups}
        />
      ) : null}

      {step === 'opened' ? (
        <OpenedParcelScreen onReadLetter={() => goTo('letter-read')} />
      ) : null}

      {step === 'letter-read' ? (
        <LetterReadScreen
          content={letterContent}
          onReply={() => goTo('attach-message')}
        />
      ) : null}

      {step === 'attach-message' ? (
        <AttachMessageScreen
          apiBusy={apiBusy}
          apiMessage={apiMessage}
          fromNickname={auth?.user.nickname}
          onAttach={() => goTo('label-complete')}
          onReplyChange={setReplyDraft}
          replyDraft={replyDraft}
          toNickname={selectedParcel?.nickname}
        />
      ) : null}

      {step === 'label-complete' ? (
        <LabelCompleteScreen
          apiBusy={apiBusy}
          apiMessage={apiMessage}
          fromNickname={auth?.user.nickname}
          onComplete={handleSendReply}
          replyDraft={replyDraft}
          toNickname={selectedParcel?.nickname}
        />
      ) : null}

      {step === 'repack-prompt' ? (
        <TapePackingScreen
          boxVariant="label"
          onFinish={tapes => {
            setPackedTapes(tapes);
            goTo('result-ok');
          }}
          title="포장해주세요,,,"
        />
      ) : null}

      {step === 'result-ok' ? (
        <StampedParcelScreen
          onPress={() => goTo('reply-locker')}
          stamp="ok"
          tapes={packedTapes}
          variant="label"
        />
      ) : null}
    </View>
  );
}
