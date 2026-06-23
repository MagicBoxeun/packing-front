import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ActionPill, ScreenFrame, WarehouseBackground } from '../components/common';
import { styles } from '../styles';

type AuthScreenProps = {
  apiBusy: boolean;
  apiMessage: string;
  authMode: 'login' | 'signup';
  emailDraft: string;
  passwordDraft: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onSwitchMode: () => void;
};

export function AuthScreen({
  apiBusy,
  apiMessage,
  authMode,
  emailDraft,
  passwordDraft,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSwitchMode,
}: AuthScreenProps) {
  return (
    <ScreenFrame background={<WarehouseBackground variant="home" />}>
      <View style={styles.authScreen}>
        <View style={styles.authPanel}>
          <Text style={styles.authTitle}>
            {authMode === 'login' ? '로그인' : '회원가입'}
          </Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={onEmailChange}
            placeholder="email@example.com"
            placeholderTextColor="#8f8aa1"
            style={styles.authInput}
            value={emailDraft}
          />
          <TextInput
            onChangeText={onPasswordChange}
            placeholder="비밀번호 8자 이상"
            placeholderTextColor="#8f8aa1"
            secureTextEntry
            style={styles.authInput}
            value={passwordDraft}
          />
          <ActionPill
            disabled={apiBusy}
            label={
              apiBusy ? '처리 중...' : authMode === 'login' ? '로그인' : '가입하기'
            }
            onPress={onSubmit}
          />
          <Pressable
            disabled={apiBusy}
            onPress={onSwitchMode}
            style={styles.authSwitch}
          >
            <Text style={styles.authSwitchText}>
              {authMode === 'login' ? '회원가입으로 전환' : '로그인으로 전환'}
            </Text>
          </Pressable>
          {apiMessage ? <Text style={styles.apiMessage}>{apiMessage}</Text> : null}
        </View>
      </View>
    </ScreenFrame>
  );
}
