import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const AppText = Text as typeof Text & {
  defaultProps?: { style?: { fontFamily: string } };
};
const AppTextInput = TextInput as typeof TextInput & {
  defaultProps?: { style?: { fontFamily: string } };
};

if (AppText.defaultProps == null) {
  AppText.defaultProps = {};
}
AppText.defaultProps.style = { fontFamily: 'Cafe24PROSlim-Regular' };

if (AppTextInput.defaultProps == null) {
  AppTextInput.defaultProps = {};
}
AppTextInput.defaultProps.style = { fontFamily: 'Cafe24PROSlim-Regular' };

const DARK = '#09041f';
const GLOW = '#4a475f';
const BOX_GOLD = '#ffc764';
const PAPER = '#fbf4e4';
const PAPER_LINE = '#d2d0c9';

type Step =
  | 'landing'
  | 'letter-entry'
  | 'loading-check'
  | 'pack-request'
  | 'sealed'
  | 'confession-stamped'
  | 'loading-send'
  | 'locker-grid'
  | 'locker-detail'
  | 'tear-package'
  | 'opened'
  | 'letter-read'
  | 'attach-message'
  | 'label-complete'
  | 'repack-prompt'
  | 'result-ok';

type BoxVariant = 'plain' | 'taped' | 'label' | 'label-taped' | 'open' | 'grid';

type AutoStep = 'loading-check' | 'loading-send';

function App() {
  const [step, setStep] = useState<Step>('landing');
  const [messageDraft, setMessageDraft] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [tearCount, setTearCount] = useState(0);

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

  const goTo = (nextStep: Step) => setStep(nextStep);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={DARK} />
        {step !== 'landing' ? (
          <Pressable
            accessibilityLabel="처음으로"
            onPress={() => {
              setStep('landing');
              setSelectedPackage(null);
              setTearCount(0);
              setMessageDraft('');
              setReplyDraft('');
            }}
            style={styles.resetButton}
          >
            <Text style={styles.resetButtonText}>RESET</Text>
          </Pressable>
        ) : null}

        {step === 'landing' ? (
          <ScreenFrame>
            <WarehouseBackground />
            <View style={styles.screenPadding}>
              <TopBackLabel label="택배 보관함" boxed />
              <View style={styles.landingTitleWrap}>
                <Text style={styles.landingTitle}>당신만의 고해성사</Text>
              </View>
              <View style={styles.centerBoxLarge}>
                <BoxImg variant="taped" />
              </View>
              <ActionPill
                label="소포 훔치기"
                onPress={() => goTo('letter-entry')}
              />
            </View>
          </ScreenFrame>
        ) : null}

        {step === 'letter-entry' ? (
          <ScreenFrame>
            <View style={styles.letterScreen}>
              <View style={styles.letterDarkTop}>
                <WarehouseBackground />
                <TopGlow />
                <View style={styles.letterBoxWrap}>
                  <BoxImg variant="open" size={200} />
                </View>
              </View>
              <View style={styles.paperCard}>
                <Text style={styles.paperTo}>To. 누군가</Text>
                <TextInput
                  multiline
                  onChangeText={setMessageDraft}
                  placeholder="고해성사를 적어보세요"
                  placeholderTextColor="#8f8b83"
                  style={styles.composeInput}
                  value={messageDraft}
                />
                <View style={styles.paperLineStack}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <View
                      key={`compose-line-${index}`}
                      style={styles.paperRule}
                    />
                  ))}
                </View>
                <ActionGhost
                  disabled={!messageDraft.trim()}
                  label="다 적었어요"
                  onPress={() => goTo('loading-check')}
                />
              </View>
            </View>
          </ScreenFrame>
        ) : null}

        {step === 'loading-check' ? (
          <ScreenFrame>
            <GlowLoading text="박스를 확인하는 중..." />
          </ScreenFrame>
        ) : null}

        {step === 'pack-request' ? (
          <ScreenFrame>
            <InteractiveTapeStage
              boxVariant="plain"
              onFinish={() => goTo('sealed')}
              title="포장해주세요!"
            />
          </ScreenFrame>
        ) : null}

        {step === 'sealed' ? (
          <ScreenFrame>
            <DarkStage
              box={<BoxImg variant="taped" />}
              footerButton="계속"
              onFooterPress={() => goTo('confession-stamped')}
              title="포장이 끝났어요!"
            />
          </ScreenFrame>
        ) : null}

        {step === 'confession-stamped' ? (
          <ScreenFrame>
            <DarkStage
              box={<BoxImg variant="taped" stamp="confession" />}
              footerButton="발송하기"
              onFooterPress={() => goTo('loading-send')}
              title="우표를 찍었어요!"
            />
          </ScreenFrame>
        ) : null}

        {step === 'loading-send' ? (
          <ScreenFrame>
            <GlowLoading text="소포를 집배원에게 주는 중,,,," />
          </ScreenFrame>
        ) : null}

        {step === 'locker-grid' ? (
          <ScreenFrame>
            <LockerShell title="택배 보관함">
              <Text style={styles.lockerLead}>받고싶은 소포를 골라보세요</Text>
              <View style={styles.gridRow}>
                <View style={styles.emptyLockerState}>
                  <Text style={styles.emptyLockerText}>아직 도착한 소포가 없어요</Text>
                </View>
              </View>
            </LockerShell>
          </ScreenFrame>
        ) : null}

        {step === 'locker-detail' ? (
          <ScreenFrame>
            <LockerShell title="택배 보관함">
              <View style={styles.detailBoxWrap}>
                <BoxImg variant="taped" size={280} />
              </View>
              <ActionPill
                label={`이 소포 열기 ${
                  selectedPackage !== null ? `#${selectedPackage + 1}` : ''
                }`}
                onPress={() => {
                  setTearCount(0);
                  goTo('tear-package');
                }}
              />
            </LockerShell>
          </ScreenFrame>
        ) : null}

        {step === 'tear-package' ? (
          <ScreenFrame>
            <DarkStage
              accent={`(${tearCount}/3)`}
              accentDone={tearCount === 3}
              box={<BoxImg variant="taped" />}
              helper="상자를 세 번 탭해 뜯어주세요."
              onBoxPress={() => {
                const nextCount = Math.min(tearCount + 1, 3);
                setTearCount(nextCount);
                if (nextCount === 3) {
                  setTimeout(() => goTo('opened'), 250);
                }
              }}
              title="소포를 뜯어주세요!"
            />
          </ScreenFrame>
        ) : null}

        {step === 'opened' ? (
          <ScreenFrame>
            <DarkStage
              box={<BoxImg variant="open" />}
              footerButton="편지 보기"
              onFooterPress={() => goTo('letter-read')}
            />
          </ScreenFrame>
        ) : null}

        {step === 'letter-read' ? (
          <ScreenFrame>
            <View style={styles.letterScreen}>
              <View style={styles.letterDarkTop}>
                <WarehouseBackground />
                <TopGlow />
                <View style={styles.letterBoxWrap}>
                  <BoxImg variant="open" size={200} />
                </View>
              </View>
              <View style={styles.paperCard}>
                <Text style={styles.paperTo}>To. 누군가</Text>
                <View style={styles.paperLines}>
                  {(messageDraft || ' ').split('\n').map((line, index) => (
                    <View key={`line-${index}`} style={styles.paperLineRow}>
                      <Text style={styles.paperBody}>{line || ' '}</Text>
                      <View style={styles.paperRule} />
                    </View>
                  ))}
                </View>
                <Text style={styles.paperCta}>다읽었어요</Text>
              </View>
              <View style={styles.paperActionOverlay}>
                <ActionGhost
                  label="답장 달기"
                  onPress={() => goTo('attach-message')}
                />
              </View>
            </View>
          </ScreenFrame>
        ) : null}

        {step === 'attach-message' ? (
          <ScreenFrame>
            <View style={styles.darkStage}>
              <TopGlow />
              <Text style={[styles.stageTitle, styles.stageTitleStandalone]}>택배에 글을 부착해보세요</Text>
              <View style={styles.stageBoxWrap}>
                <ParcelTopCard />
              </View>
              <View style={styles.replyEditor}>
                <Text style={styles.replyLabel}>답장</Text>
                <TextInput
                  multiline
                  onChangeText={setReplyDraft}
                  placeholder="받은 편지에 답장을 적어보세요"
                  placeholderTextColor="#8f8aa1"
                  style={styles.replyInput}
                  value={replyDraft}
                />
              </View>
              <ActionPill
                label="송장 붙이기"
                onPress={() => goTo('label-complete')}
              />
            </View>
          </ScreenFrame>
        ) : null}

        {step === 'label-complete' ? (
          <ScreenFrame>
            <DarkStage
              box={<ShippingLabelCard body={replyDraft} />}
              footerButton="작성완료"
              onFooterPress={() => goTo('repack-prompt')}
            />
          </ScreenFrame>
        ) : null}

        {step === 'repack-prompt' ? (
          <ScreenFrame>
            <InteractiveTapeStage
              boxVariant="label"
              onFinish={() => goTo('result-ok')}
              title="포장해주세요,,,"
            />
          </ScreenFrame>
        ) : null}

        {step === 'result-ok' ? (
          <ScreenFrame>
            <DarkStage
              box={<BoxImg variant="label-taped" stamp="ok" />}
              footerButton="보관함으로 돌아가기"
              onFooterPress={() => goTo('locker-grid')}
              title="우표를 찍었어요!"
            />
          </ScreenFrame>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function ScreenFrame({ children }: { children: React.ReactNode }) {
  return <View style={styles.phoneFrame}>{children}</View>;
}

function DarkStage({
  accent,
  accentDone,
  bottomElement,
  box,
  footerButton,
  helper,
  onBoxPress,
  onFooterPress,
  title,
}: {
  accent?: string;
  accentDone?: boolean;
  bottomElement?: React.ReactNode;
  box: React.ReactNode;
  footerButton?: string;
  helper?: string;
  onBoxPress?: () => void;
  onFooterPress?: () => void;
  title?: string;
}) {
  return (
    <View style={styles.darkStage}>
      <TopGlow />
      {title ? (
        <View style={styles.stageTitleRow}>
          <Text style={styles.stageTitle}>{title}</Text>
          {accent ? (
            <Text
              style={[
                styles.stageAccent,
                !accentDone && { color: '#f7f6fb' },
              ]}>
              {accent}
            </Text>
          ) : null}
        </View>
      ) : null}
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
      <Pressable
        disabled={!onBoxPress}
        onPress={onBoxPress}
        style={styles.stageBoxWrap}
      >
        {box}
      </Pressable>
      {bottomElement ? (
        <View style={styles.stageBottomElement}>{bottomElement}</View>
      ) : null}
      {footerButton ? (
        <ActionGhost label={footerButton} onPress={onFooterPress} />
      ) : null}
    </View>
  );
}

const MAX_TAPES = 50;

const CUBE_FACE_TEMPLATES: Record<'plain' | 'label', string> = {
  plain: '',
  label: `<div class="facelabel"><div class="lbl-line"></div><div class="lbl-line short"></div><div class="lbl-line short"></div></div>`,
};

function cubeHtml(variant: BoxVariant): string {
  const hasLabel = variant === 'label';
  const labelPatch = hasLabel ? CUBE_FACE_TEMPLATES.label : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; height: 100%; width: 100%;
    background: transparent; overflow: hidden;
    -webkit-user-select: none; user-select: none;
    -webkit-touch-callout: none;
  }
  #root { position: absolute; inset: 0; display: flex; flex-direction: column; touch-action: none; }
  #stage {
    height: 462px; flex: 0 0 auto; position: relative;
    display: flex; align-items: center; justify-content: center;
    perspective: 720px; perspective-origin: 50% 48%;
    cursor: grab;
  }
  #world { transform: scale(1.36); transform-style: preserve-3d; }
  #world.press { animation: bounce 0.26s ease; }
  @keyframes bounce { 0% { transform: scale(1.36); } 45% { transform: scale(1.28); } 100% { transform: scale(1.36); } }
  #scene {
    position: relative; width: 150px; height: 150px;
    transform-style: preserve-3d; will-change: transform;
  }
  .face {
    position: absolute; width: 150px; height: 150px;
    display: flex; align-items: center; justify-content: center;
    border: 0;
    box-shadow: none;
    backface-visibility: hidden;
    overflow: hidden;
  }
  .f-front  { background: #d9a33b; transform: translateZ(75px); }
  .f-back   { background: #c79032; transform: rotateY(180deg) translateZ(75px); }
  .f-right  { background: #ffc55e; transform: rotateY(90deg) translateZ(75px); }
  .f-left   { background: #d9a33b; transform: rotateY(-90deg) translateZ(75px); }
  .f-top    { background: #ffd381; transform: rotateX(90deg) translateZ(75px); }
  .f-bottom { background: #9b7028; transform: rotateX(-90deg) translateZ(75px); }
  .face::before, .face::after { content: ''; position: absolute; display: none; }
  .f-top::before {
    display: block; left: 50%; top: -6px; bottom: -6px; width: 2px;
    background: rgba(137,92,26,0.45); transform: translateX(-1px);
  }
  .facelabel {
    position: absolute; right: 10px; bottom: 10px; width: 58px; height: 40px;
    background: #f5f1e6; border: 1px solid #5a4a28;
    display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 5px 6px;
  }
  .lbl-line { height: 3px; background: #2c2c2c; width: 100%; }
  .lbl-line.short { width: 58%; }
  .tape {
    position: absolute;
    background: #3366FF; border: 0; border-radius: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.28);
    z-index: 5;
  }
  .tape::after {
    content: ''; position: absolute; left: 3px; right: 3px; top: 3px; height: 3px;
    background: rgba(255,255,255,0.25); border-radius: 1px;
  }
  #dispenser {
    position: relative; height: 118px; flex-shrink: 0; margin-top: -45px;
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 0;
  }
  #roll {
    display: none;
    width: 78px; height: 78px; border-radius: 50%;
    background: radial-gradient(circle at 42% 38%, #d4e0ff 0%, #7e9bf0 38%, #3a5bd0 68%, #27408f 100%);
    border: 3px solid #1f3a8a; position: relative;
    box-shadow: 0 6px 14px rgba(0,0,0,0.5);
  }
  #roll::after {
    content: ''; position: absolute; left: 50%; top: 50%; width: 22px; height: 22px;
    border-radius: 50%; background: #0e1c4a; transform: translate(-50%, -50%);
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);
  }
  #tab {
    position: absolute; left: 50%; top: 0;
    width: 246px; height: 67px; background: #3366FF; border: 0;
    transform: translateX(-50%);
    clip-path: polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%, 6% 50%);
    box-shadow: none;
  }
  #tab::before {
    display: none;
  }
  #grab { position: absolute; left: 50%; top: 0; width: 246px; height: 67px; transform: translateX(-50%); }
  #ribbon {
    position: absolute; display: none; transform-origin: 0 50%;
    height: 26px; background: #3366FF; border: 1px solid #1f47b8;
    box-shadow: 0 3px 7px rgba(0,0,0,0.45); pointer-events: none; border-radius: 1px;
  }
  #ribbon::after {
    content: ''; position: absolute; left: 4px; right: 4px; top: 4px; height: 3px;
    background: rgba(255,255,255,0.25); border-radius: 1px;
  }
  .hint {
    position: absolute; left: 0; right: 0; bottom: 4px; text-align: center;
    color: rgba(255,255,255,0.55); font-size: 11px; letter-spacing: 0.3px;
    pointer-events: none; display: none;
  }
</style>
</head>
<body>
  <div id="root">
    <div id="stage">
      <div id="world">
        <div id="scene">
          <div class="face f-front" data-face="front">${labelPatch}</div>
          <div class="face f-back" data-face="back"></div>
          <div class="face f-right" data-face="right"></div>
          <div class="face f-left" data-face="left"></div>
          <div class="face f-top" data-face="top"></div>
          <div class="face f-bottom" data-face="bottom"></div>
        </div>
      </div>
    </div>
    <div id="dispenser">
      <div id="roll"></div>
      <div id="tab"></div>
      <div id="grab"></div>
      <div class="hint">테이프를 끌어당겨 붙이세요 · 박스를 드래그하면 돌아요</div>
    </div>
    <div id="ribbon"></div>
  </div>
<script>
(function () {
  var MAX = 50, SIDE = 150, HALF = SIDE / 2;
  var scene = document.getElementById('scene');
  var world = document.getElementById('world');
  var stage = document.getElementById('stage');
  var grab = document.getElementById('grab');
  var ribbon = document.getElementById('ribbon');
  var faces = {};
  Array.prototype.forEach.call(document.querySelectorAll('.face'), function (f) {
    faces[f.dataset.face] = f;
  });
  var rotX = -16, rotY = -28, total = 0;
  var mode = 'idle';

  function render() {
    scene.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
  }
  render();

  function notify() {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ count: total }));
    }
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function frontFace() {
    var N = {
      front: [0, 0, 1], back: [0, 0, -1],
      right: [1, 0, 0], left: [-1, 0, 0],
      top: [0, -1, 0], bottom: [0, 1, 0]
    };
    var cy = Math.cos(rotY * Math.PI / 180), sy = Math.sin(rotY * Math.PI / 180);
    var cx = Math.cos(rotX * Math.PI / 180), sx = Math.sin(rotX * Math.PI / 180);
    var best = 'front', bz = -2;
    Object.keys(N).forEach(function (k) {
      var x = N[k][0], y = N[k][1], z = N[k][2];
      var z1 = -x * sy + z * cy;
      var z2 = y * sx + z1 * cx;
      if (z2 > bz) { bz = z2; best = k; }
    });
    return best;
  }

  function toLocal(sdx, sdy) {
    var rxd = rotX * Math.PI / 180, ryd = rotY * Math.PI / 180;
    var cx = Math.cos(rxd), sx = Math.sin(rxd), cy = Math.cos(ryd), sy = Math.sin(ryd);
    return { lx: sdx * cy + sdy * sx * sy, ly: sdy * cx };
  }

  function pulse() {
    world.classList.remove('press');
    void world.offsetWidth;
    world.classList.add('press');
  }

  function connectedFaces(baseFace, orientation) {
    if (orientation === 'vertical') {
      if (baseFace === 'top' || baseFace === 'bottom') return [baseFace, 'front'];
      return [baseFace, 'top'];
    }

    if (baseFace === 'left' || baseFace === 'right') return [baseFace, 'front'];
    return [baseFace, 'right'];
  }

  function makeTapeSegment(faceName, orientation, offset, tapeId, segmentIndex) {
    var t = document.createElement('div');
    t.className = 'tape';
    t.dataset.tapeId = tapeId;
    t.dataset.segment = segmentIndex;

    if (orientation === 'horizontal') {
      t.style.width = '152px';
      t.style.height = '24px';
      t.style.left = '-1px';
      t.style.top = (HALF - 11 + offset) + 'px';
    } else {
      t.style.width = '24px';
      t.style.height = '152px';
      t.style.left = (HALF - 11 + offset) + 'px';
      t.style.top = '-1px';
    }

    faces[faceName].appendChild(t);
  }

  function commitTape(tx, ty, fx, fy) {
    if (total >= MAX) { notify(); return; }
    var r = scene.getBoundingClientRect();
    var ccx = r.left + r.width / 2, ccy = r.top + r.height / 2;
    var sdx = fx - ccx, sdy = fy - ccy;
    if (Math.hypot(sdx, sdy) > 135) return;
    var loc = toLocal(sdx, sdy);
    var orientation = Math.abs(fx - tx) > Math.abs(fy - ty) ? 'horizontal' : 'vertical';
    var offset = orientation === 'horizontal'
      ? clamp(loc.ly, -56, 56)
      : clamp(loc.lx, -56, 56);
    var wrappedFaces = connectedFaces(frontFace(), orientation);
    var tapeId = total;
    wrappedFaces.forEach(function (name, index) {
      makeTapeSegment(name, orientation, offset, tapeId, index);
    });
    total++;
    notify();
    pulse();
  }

  function showRibbon(tx, ty, fx, fy) {
    var dx = fx - tx, dy = fy - ty;
    var len = Math.hypot(dx, dy);
    var ang = Math.atan2(dy, dx) * 180 / Math.PI;
    ribbon.style.display = 'block';
    ribbon.style.left = tx + 'px';
    ribbon.style.top = (ty - 13) + 'px';
    ribbon.style.width = len + 'px';
    ribbon.style.transform = 'rotate(' + ang + 'deg)';
  }
  function hideRibbon() { ribbon.style.display = 'none'; }

  var grabTipX = 0, grabTipY = 0;
  var startX = 0, startY = 0, startRX = 0, startRY = 0;

  function pointOf(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function rotateDown(e) {
    var p = pointOf(e);
    mode = 'rotate';
    startX = p.x; startY = p.y; startRX = rotX; startRY = rotY;
    e.preventDefault();
  }
  function tapeDown(e) {
    var p = pointOf(e);
    var gr = grab.getBoundingClientRect();
    grabTipX = gr.left + gr.width / 2;
    grabTipY = gr.top + gr.height / 2;
    mode = 'tape';
    showRibbon(grabTipX, grabTipY, p.x, p.y);
    e.preventDefault();
    e.stopPropagation();
  }

  function move(e) {
    if (mode === 'idle') return;
    var p = pointOf(e);
    if (mode === 'rotate') {
      var dx = p.x - startX, dy = p.y - startY;
      rotY = startRY + dx * 0.5;
      rotX = clamp(startRX + dy * 0.5, -88, 88);
      render();
    } else if (mode === 'tape') {
      showRibbon(grabTipX, grabTipY, p.x, p.y);
    }
    e.preventDefault();
  }
  function up(e) {
    if (mode === 'tape') {
      var p = pointOf(e);
      commitTape(grabTipX, grabTipY, p.x, p.y);
      hideRibbon();
    }
    mode = 'idle';
  }

  stage.addEventListener('mousedown', rotateDown);
  grab.addEventListener('mousedown', tapeDown);
  grab.addEventListener('touchstart', tapeDown, { passive: false });
  stage.addEventListener('touchstart', rotateDown, { passive: false });

  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  window.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', up);
  window.addEventListener('touchcancel', up);
})();
</script>
</body>
</html>`;
}

function InteractiveTapeStage({
  boxVariant,
  onFinish,
}: {
  boxVariant: BoxVariant;
  onFinish: () => void;
  title: string;
}) {
  const [tapeCount, setTapeCount] = useState(0);
  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data) as { count?: number };
      if (typeof parsed.count === 'number') {
        setTapeCount(Math.min(parsed.count, MAX_TAPES));
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.tapeScreen}>
      <TopGlow />
      <View style={styles.tapeWebViewWrap}>
        <WebView
          originWhitelist={['*']}
          source={{ html: cubeHtml(boxVariant) }}
          onMessage={handleMessage}
          style={styles.tapeWebView}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          opaque={false}
          javaScriptEnabled
        />
      </View>

      <Pressable
        disabled={tapeCount === 0}
        onPress={onFinish}
        style={styles.tapeCompleteButton}
      >
        <Text style={styles.tapeCompleteText}>포장완료</Text>
      </Pressable>
    </View>
  );
}

function GlowLoading({ text }: { text: string }) {
  return (
    <View style={styles.darkStage}>
      <TopGlow />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

function WarehouseBackground() {
  return (
    <Image
      resizeMode="cover"
      source={require('./assets/conveyor-background.png')}
      style={styles.bgImage}
    />
  );
}

function TopGlow() {
  return (
    <View pointerEvents="none" style={styles.topGlowWrap}>
      <View style={styles.stageGlow} />
    </View>
  );
}

function TopBackLabel({ boxed, label }: { boxed?: boolean; label: string }) {
  return (
    <View style={styles.topBackRow}>
      <Text style={styles.backArrow}>{'<'}</Text>
      {boxed ? <View style={styles.boxedIcon} /> : null}
      <Text style={styles.topBackLabel}>{label}</Text>
    </View>
  );
}

const BOX_SOURCES: Record<BoxVariant, ReturnType<typeof require>> = {
  plain: require('./assets/box-plain.png'),
  taped: require('./assets/box-taped.png'),
  open: require('./assets/box-open.png'),
  label: require('./assets/box-label.png'),
  'label-taped': require('./assets/box-label-taped.png'),
  grid: require('./assets/box-taped.png'),
};

function BoxImg({
  size = 212,
  stamp,
  variant,
}: {
  size?: number;
  stamp?: 'confession' | 'ok';
  variant: BoxVariant;
}) {
  return (
    <View style={{ height: size, width: size }}>
      <Image
        resizeMode="contain"
        source={BOX_SOURCES[variant]}
        style={{ width: '100%', height: '100%' }}
      />
      {stamp === 'confession' ? (
        <Image
          resizeMode="contain"
          source={require('./assets/stamp-confession.png')}
          style={[styles.stampOverlay, { height: size * 0.55, width: size * 0.55 }]}
        />
      ) : null}
      {stamp === 'ok' ? (
        <Image
          resizeMode="contain"
          source={require('./assets/stamp-ok.png')}
          style={[styles.stampOverlay, { height: size * 0.6, width: size * 0.6 }]}
        />
      ) : null}
    </View>
  );
}

function LockerShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.lockerShell}>
      <WarehouseBackground />
      <TopBackLabel label={title} />
      {children}
    </View>
  );
}

function ActionPill({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionPill}>
      <Text style={styles.actionPillText}>{label}</Text>
    </Pressable>
  );
}

function ActionGhost({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.actionGhost, disabled && styles.actionGhostDisabled]}
    >
      <Text style={styles.actionGhostText}>{label}</Text>
    </Pressable>
  );
}

function ParcelTopCard() {
  return (
    <View style={styles.parcelTopWrap}>
      <View style={styles.parcelTopFace} />
      <View style={styles.parcelSticker} />
      <View style={styles.parcelFrontFace} />
    </View>
  );
}

function ShippingLabelCard({
  body,
  compact,
}: {
  body?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.shippingCard, compact && styles.shippingCardCompact]}>
      <View style={styles.shippingHeader}>
        <Barcode />
        <Text style={styles.shippingCode}>송장번호</Text>
        <Barcode />
      </View>
      <View style={styles.shippingInfo}>
        <View style={styles.shippingColTitle}>
          <Text style={styles.verticalKorean}>정보</Text>
        </View>
        <View style={styles.shippingColBody}>
          <Text style={styles.shippingText}>from.</Text>
          <Text style={styles.shippingText}>to.</Text>
        </View>
        <Barcode small />
      </View>
      <View style={styles.shippingMemo}>
        <View style={styles.shippingColTitleRed}>
          <Text style={styles.verticalKoreanRed}>내용</Text>
        </View>
        <Text style={styles.shippingMemoText}>
          {body || ''}
        </Text>
      </View>
    </View>
  );
}

function Barcode({ small }: { small?: boolean }) {
  return (
    <View style={[styles.barcode, small && styles.barcodeSmall]}>
      {Array.from({ length: small ? 6 : 9 }).map((_, index) => (
        <View
          key={`barcode-${small ? 'small' : 'full'}-${index}`}
          style={[
            styles.barcodeLine,
            index % 2 === 0 ? styles.barcodeThick : styles.barcodeThin,
          ]}
        />
      ))}
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050112',
  },
  resetButton: {
    backgroundColor: '#18122f',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    position: 'absolute',
    right: 16,
    top: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 20,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Cafe24PROSlim-Bold',
  },
  bgImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  previewShell: {
    width: '100%',
  },
  phoneFrame: {
    backgroundColor: DARK,
    flex: 1,
  },
  screenPadding: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  topBackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  backArrow: {
    color: '#ffffff',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 22,
    lineHeight: 22,
  },
  boxedIcon: {
    borderColor: '#ffffff',
    borderRadius: 3,
    borderWidth: 1,
    height: 14,
    width: 14,
  },
  topBackLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Cafe24PROSlim-Light',
  },
  landingTitleWrap: {
    marginTop: 138,
  },
  landingTitle: {
    color: '#ffffff',
    fontSize: 50,
    fontFamily: 'Cafe24PROSlim-Bold',
    letterSpacing: -1.4,
    lineHeight: 56,
  },
  centerBoxLarge: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  actionPill: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#efe8f9',
    borderRadius: 999,
    marginBottom: 68,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  actionPillText: {
    color: '#130c1f',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 20,
  },
  darkStage: {
    alignItems: 'center',
    backgroundColor: DARK,
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  tapeScreen: {
    alignItems: 'center',
    backgroundColor: DARK,
    flex: 1,
    overflow: 'hidden',
  },
  topGlowWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageGlow: {
    backgroundColor: GLOW,
    borderRadius: 300,
    elevation: 20,
    height: 280,
    opacity: 0.45,
    shadowColor: GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 120,
    width: 420,
  },
  stageTitleRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    zIndex: 2,
  },
  stageTitle: {
    color: '#f7f6fb',
    fontSize: 32,
    fontFamily: 'Cafe24PROSlim-Light',
    textAlign: 'center',
  },
  stageTitleStandalone: {
    alignSelf: 'stretch',
    marginTop: 20,
    zIndex: 2,
  },
  stageAccent: {
    color: '#db4451',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 28,
    textAlign: 'center',
  },
  helperText: {
    alignSelf: 'stretch',
    color: '#a8a3b8',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    zIndex: 2,
  },
  stageBoxWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 38,
    width: '100%',
    zIndex: 2,
  },
  stageBottomElement: {
    marginTop: -8,
    zIndex: 2,
  },
  tapeWebViewWrap: {
    height: 590,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 82,
    width: '100%',
    zIndex: 2,
  },
  tapeWebView: {
    backgroundColor: 'transparent',
    height: '100%',
    width: '100%',
  },
  tapeCompleteButton: {
    alignItems: 'center',
    bottom: 108,
    height: 48,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 3,
  },
  tapeCompleteText: {
    color: '#ffffff',
    fontFamily: 'Cafe24PROSlim-Light',
    fontSize: 24,
    textAlign: 'center',
  },
  actionGhost: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 42,
    paddingHorizontal: 28,
    paddingVertical: 12,
    zIndex: 2,
  },
  actionGhostDisabled: {
    opacity: 0.35,
  },
  actionGhostText: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'Cafe24PROSlim-Light',
  },
  loadingText: {
    alignSelf: 'stretch',
    color: '#e8e5f0',
    fontSize: 24,
    fontFamily: 'Cafe24PROSlim-Light',
    marginTop: 140,
    textAlign: 'center',
    zIndex: 2,
  },
  letterScreen: {
    flex: 1,
  },
  letterDarkTop: {
    flex: 1,
    overflow: 'hidden',
  },
  letterBoxWrap: {
    alignItems: 'center',
    bottom: -20,
    position: 'absolute',
    width: '100%',
  },
  paperCard: {
    backgroundColor: PAPER,
    minHeight: 400,
    paddingBottom: 26,
    paddingHorizontal: 32,
    paddingTop: 34,
  },
  paperTo: {
    color: '#171717',
    fontSize: 28,
    fontFamily: 'Cafe24PROSlim-Bold',
    marginBottom: 32,
  },
  composeInput: {
    color: '#2b2b2b',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 18,
    lineHeight: 30,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  paperLineStack: {
    gap: 26,
    marginTop: -8,
  },
  paperLines: {
    gap: 16,
  },
  paperLineRow: {
    gap: 8,
  },
  paperBody: {
    color: '#2b2b2b',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 18,
    minHeight: 24,
  },
  paperRule: {
    backgroundColor: PAPER_LINE,
    height: 2,
    opacity: 0.9,
    width: '100%',
  },
  paperCta: {
    color: '#9f9b93',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 19,
    marginTop: 74,
    textAlign: 'center',
  },
  paperActionOverlay: {
    bottom: 28,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 4,
  },
  lockerShell: {
    backgroundColor: DARK,
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  lockerLead: {
    color: '#f6f3fa',
    fontSize: 24,
    fontFamily: 'Cafe24PROSlim-Light',
    marginTop: 64,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  emptyLockerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyLockerText: {
    color: '#a8a3b8',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 16,
  },
  detailBoxWrap: {
    alignItems: 'center',
    height: 280,
    justifyContent: 'center',
    marginTop: 60,
  },
  replyEditor: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
    width: '100%',
    zIndex: 2,
  },
  replyLabel: {
    color: '#e7e2f0',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 14,
    marginBottom: 10,
  },
  replyInput: {
    color: '#ffffff',
    fontFamily: 'Cafe24PROSlim-Regular',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  parcelTopWrap: {
    height: 320,
    width: 390,
  },
  parcelTopFace: {
    backgroundColor: '#f9d289',
    height: 168,
    left: 0,
    position: 'absolute',
    top: 126,
    width: 390,
  },
  parcelSticker: {
    backgroundColor: '#f5f5f5',
    height: 54,
    left: 16,
    position: 'absolute',
    top: 126,
    width: 128,
  },
  parcelFrontFace: {
    backgroundColor: BOX_GOLD,
    height: 114,
    left: 0,
    position: 'absolute',
    top: 294,
    width: 390,
  },
  shippingCard: {
    backgroundColor: PAPER,
    borderColor: '#222222',
    borderWidth: 4,
    padding: 8,
    width: 358,
  },
  shippingCardCompact: {
    width: 356,
  },
  shippingHeader: {
    alignItems: 'center',
    borderColor: '#111111',
    borderWidth: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  shippingCode: {
    color: '#111111',
    fontSize: 28,
    fontFamily: 'Cafe24PROSlim-Bold',
  },
  shippingInfo: {
    borderColor: '#234db1',
    borderWidth: 3,
    flexDirection: 'row',
    marginTop: 4,
    minHeight: 64,
  },
  shippingColTitle: {
    alignItems: 'center',
    borderColor: '#111111',
    borderRightWidth: 3,
    justifyContent: 'center',
    width: 28,
  },
  shippingColBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shippingText: {
    color: '#111111',
    fontSize: 14,
    fontFamily: 'Cafe24PROSlim-Bold',
  },
  shippingMemo: {
    borderColor: '#cf1d1d',
    borderWidth: 3,
    flexDirection: 'row',
    marginTop: 4,
    minHeight: 108,
  },
  shippingColTitleRed: {
    alignItems: 'center',
    borderColor: '#cf1d1d',
    borderRightWidth: 3,
    justifyContent: 'center',
    width: 28,
  },
  shippingMemoText: {
    color: '#111111',
    flex: 1,
    fontSize: 15,
    fontFamily: 'Cafe24PROSlim-Bold',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  verticalKorean: {
    color: '#111111',
    fontSize: 14,
    fontFamily: 'Cafe24PROSlim-Bold',
    lineHeight: 16,
    textAlign: 'center',
  },
  verticalKoreanRed: {
    color: '#111111',
    fontSize: 14,
    fontFamily: 'Cafe24PROSlim-Bold',
    lineHeight: 16,
    textAlign: 'center',
  },
  barcode: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    height: 34,
  },
  barcodeSmall: {
    marginHorizontal: 8,
  },
  barcodeLine: {
    backgroundColor: '#111111',
    height: '100%',
  },
  barcodeThick: {
    width: 3,
  },
  barcodeThin: {
    width: 1,
  },
  stampOverlay: {
    bottom: 0,
    position: 'absolute',
    right: -20,
  },
});

export default App;
