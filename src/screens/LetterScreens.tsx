import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { ActionPill, ScreenFrame, TopGlow, WarehouseBackground } from '../components/common';
import { BoxImg } from '../components/parcel';
import { styles } from '../styles';

const LETTER_RULE_COUNT = 7;

type LetterComposeScreenProps = {
  apiMessage: string;
  messageDraft: string;
  onDone: () => void;
  onMessageChange: (value: string) => void;
};

export function LetterComposeScreen({
  apiMessage,
  messageDraft,
  onDone,
  onMessageChange,
}: LetterComposeScreenProps) {
  return (
    <ScreenFrame>
      <View style={styles.letterScreen}>
        <LetterTopBox />
        <View style={styles.paperCard}>
          <Text style={styles.paperTo}>To. 누군가</Text>
          <View style={styles.ruledTextArea}>
            <TextInput
              multiline
              onChangeText={onMessageChange}
              placeholder="고해성사를 적어보세요"
              placeholderTextColor="#8f8b83"
              style={styles.composeInput}
              value={messageDraft}
            />
            <View style={styles.ruledLines} pointerEvents="none">
              {Array.from({ length: LETTER_RULE_COUNT }).map((_, index) => (
                <View key={`line-${index}`} style={styles.paperRule} />
              ))}
            </View>
          </View>
          <View style={styles.paperActionRow}>
            <ActionPill
              disabled={messageDraft.trim().length < 10}
              label="다 적었어요"
              onPress={onDone}
            />
            {apiMessage ? <Text style={styles.paperError}>{apiMessage}</Text> : null}
          </View>
        </View>
      </View>
    </ScreenFrame>
  );
}

type LetterReadScreenProps = {
  content: string;
  onReply: () => void;
};

export function LetterReadScreen({ content, onReply }: LetterReadScreenProps) {
  return (
    <ScreenFrame>
      <View style={styles.letterScreen}>
        <LetterTopBox />
        <View style={styles.paperCard}>
          <Text style={styles.paperTo}>To. 누군가</Text>
          <View style={styles.ruledTextArea}>
            <Text style={styles.paperReadBody}>{content || ' '}</Text>
            <View style={styles.ruledLines} pointerEvents="none">
              {Array.from({ length: LETTER_RULE_COUNT }).map((_, index) => (
                <View key={`line-${index}`} style={styles.paperRule} />
              ))}
            </View>
          </View>
          <View style={styles.paperActionRow}>
            <ActionPill label="답장 달기" onPress={onReply} />
          </View>
        </View>
      </View>
    </ScreenFrame>
  );
}

function LetterTopBox() {
  return (
    <View style={styles.letterDarkTop}>
      <WarehouseBackground />
      <TopGlow />
      <View style={styles.letterBoxWrap}>
        <BoxImg variant="open" size={200} />
      </View>
    </View>
  );
}
