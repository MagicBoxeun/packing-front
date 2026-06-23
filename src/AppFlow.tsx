import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthSession, PackingApi, ParcelCreated, ParcelFeedItem } from '../api';
import { DARK, DEV_STEP, FALLBACK_PACKAGES } from './constants';
import { AuthScreen } from './screens/AuthScreen';
import { LandingScreen } from './screens/LandingScreen';
import { LetterComposeScreen, LetterReadScreen } from './screens/LetterScreens';
import { LockerDetailScreen, LockerGridScreen } from './screens/LockerScreens';
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
import { AutoStep, Step, TapeData } from './types';

export default function AppFlow() {
  const insets = useSafeAreaInsets();
  const apiRef = useRef(new PackingApi());
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
  const [tearCount, setTearCount] = useState(0);
  const [packedTapes, setPackedTapes] = useState<TapeData[]>([]);
  const displayPackages = DEV_STEP ? FALLBACK_PACKAGES : feedPackages;
  const selectedPackage = DEV_STEP
    ? displayPackages[0]?.id ?? null
    : selectedPackageState;
  const selectedParcel = selectedPackage
    ? displayPackages.find(pkg => pkg.id === selectedPackage) ?? null
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
    setTearCount(0);
    setMessageDraft('');
    setReplyDraft('');
    setOpenedContent('');
    setCreatedParcel(null);
    setPackedTapes([]);
    setApiMessage('');
  }, []);

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
      const nextAuth =
        authMode === 'login'
          ? await apiRef.current.login(email, password)
          : await apiRef.current.signup(email, password);
      setAuth(nextAuth);
      setStep('landing');
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
      setMessageDraft('');
      setReplyDraft('');
      setOpenedContent('');
      setCreatedParcel(null);
      setTearCount(0);
      setPackedTapes([]);
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

  useEffect(() => {
    if (step === 'locker-grid') {
      refreshFeed();
    }
  }, [refreshFeed, step]);

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
      });
      setCreatedParcel(parcel);
      goTo('loading-send');
    } catch (error) {
      setApiMessage(
        error instanceof Error ? error.message : '소포 발송에 실패했어요.',
      );
    } finally {
      setApiBusy(false);
    }
  }, [auth, messageDraft]);

  const handleOpenParcel = useCallback(async () => {
    if (!selectedPackage) {
      setApiMessage('열 소포를 먼저 골라주세요.');
      setTearCount(0);
      return;
    }

    setApiBusy(true);
    setApiMessage('');
    try {
      const result = await apiRef.current.openParcel(selectedPackage);
      setOpenedContent(result.content);
      setTimeout(() => goTo('opened'), 250);
    } catch (error) {
      setTearCount(0);
      setApiMessage(
        error instanceof Error ? error.message : '소포를 열지 못했어요.',
      );
    } finally {
      setApiBusy(false);
    }
  }, [selectedPackage]);

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

  const handleTearPackage = useCallback(() => {
    const nextCount = Math.min(tearCount + 1, 3);
    setTearCount(nextCount);
    if (nextCount === 3) {
      handleOpenParcel();
    }
  }, [handleOpenParcel, tearCount]);

  const letterContent =
    (selectedPackage !== null ? openedContent : messageDraft) ||
    createdParcel?.tagline ||
    ' ';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={DARK} />
      {step !== 'landing' && step !== 'auth' ? (
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

      {step === 'landing' ? (
        <LandingScreen
          apiBusy={apiBusy}
          onLogout={handleLogout}
          onOpenLocker={() => goTo('locker-grid')}
          onWriteConfession={() => goTo('letter-entry')}
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

      {step === 'locker-grid' ? (
        <LockerGridScreen
          apiMessage={apiMessage}
          feedLoading={feedLoading}
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
          selectedParcel={selectedParcel}
          onBack={() => goTo('locker-grid')}
          onOpen={() => {
            setTearCount(0);
            goTo('tear-package');
          }}
        />
      ) : null}

      {step === 'tear-package' ? (
        <TearPackageScreen
          apiBusy={apiBusy}
          apiMessage={apiMessage}
          onTear={handleTearPackage}
          tearCount={tearCount}
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
          onAttach={() => goTo('label-complete')}
          onReplyChange={setReplyDraft}
          replyDraft={replyDraft}
        />
      ) : null}

      {step === 'label-complete' ? (
        <LabelCompleteScreen
          apiBusy={apiBusy}
          apiMessage={apiMessage}
          onComplete={handleSendReply}
          replyDraft={replyDraft}
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
          onPress={() => goTo('locker-grid')}
          stamp="ok"
          tapes={packedTapes}
          variant="label"
        />
      ) : null}
    </View>
  );
}
