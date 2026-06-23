/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native', () => {
  const ReactMock = require('react');

  const createComponent =
    (name: string) =>
    ({ children, ...props }: any) =>
      ReactMock.createElement(name, props, children);

  return {
    Pressable: createComponent('Pressable'),
    Image: createComponent('Image'),
    StatusBar: createComponent('StatusBar'),
    StyleSheet: {
      absoluteFill: {},
      create: (styles: object) => styles,
    },
    Text: createComponent('Text'),
    TextInput: createComponent('TextInput'),
    useWindowDimensions: () => ({ height: 844, width: 390 }),
    View: createComponent('View'),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactMock = require('react');

  return {
    SafeAreaProvider: ({ children }: any) =>
      ReactMock.createElement('SafeAreaProvider', null, children),
    SafeAreaView: ({ children, ...props }: any) =>
      ReactMock.createElement('SafeAreaView', props, children),
    useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
  };
});

const App = require('../App').default;

beforeEach(() => {
  (globalThis as any).fetch = jest.fn(async (url: string, options?: any) => {
    const method = options?.method ?? 'GET';
    const path = String(url);

    if (path.endsWith('/auth/login') && method === 'POST') {
      return jsonResponse({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1', nickname: '용감한 코알라', isNew: false },
      });
    }

    if (path.endsWith('/auth/logout') && method === 'POST') {
      return jsonResponse(null);
    }

    if (path.endsWith('/parcels') && method === 'POST') {
      return jsonResponse(
        {
          id: 'parcel-new',
          nickname: '용감한 코알라',
          tagline: '비밀이 있어요. 오늘은 API로 보냅니다.',
          createdAt: '2026-06-23T12:00:00',
        },
        201,
      );
    }

    if (path.includes('/parcels/feed') && method === 'GET') {
      return jsonResponse({
        items: [
          {
            id: 'parcel-1',
            nickname: '익명의 고래',
            tagline: '늦잠을 버스 탓으로 돌렸어요',
          },
        ],
        nextCursor: null,
      });
    }

    if (path.endsWith('/parcels/parcel-1/open') && method === 'POST') {
      return jsonResponse({
        success: true,
        content:
          '오늘 지각을 했는데 버스 탓을 했어요.\n사실 그냥 늦잠 잔 거였어요.',
      });
    }

    if (path.endsWith('/parcels/parcel-1/reply') && method === 'POST') {
      return jsonResponse(
        {
          id: 'reply-1',
          message: '괜찮아요',
          createdAt: '2026-06-23T12:05:00',
        },
        201,
      );
    }

    throw new Error(`unexpected fetch: ${method} ${path}`);
  });
});

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ success: true, data, message: null }),
  };
}

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

// --- click-test helpers -----------------------------------------------------
const joinText = (c: any): string =>
  Array.isArray(c) ? c.map(joinText).join('') : c == null ? '' : String(c);

const textOf = (node: any): string =>
  node
    .findAll((n: any) => n.type === 'Text')
    .map((n: any) => joinText(n.props.children))
    .join(' ');

async function press(tree: any, label: string) {
  const target = tree.root
    .findAll((n: any) => n.type === 'Pressable' && !!n.props.onPress)
    .find((p: any) => textOf(p).includes(label));
  if (!target) {
    throw new Error(`button not found: "${label}"`);
  }
  if (target.props.disabled) {
    throw new Error(`button is disabled (not clickable): "${label}"`);
  }
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
}

async function pressByA11y(tree: any, a11y: string) {
  const target = tree.root.find(
    (n: any) => n.type === 'Pressable' && n.props.accessibilityLabel === a11y,
  );
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
}

async function pressBox(tree: any) {
  // DarkStage tap target: a Pressable with onPress but no Text descendant
  const target = tree.root
    .findAll((n: any) => n.type === 'Pressable' && !!n.props.onPress)
    .find((p: any) => textOf(p).trim() === '');
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
}

function setInput(tree: any, placeholder: string, value: string) {
  const input = tree.root.find(
    (n: any) => n.type === 'TextInput' && n.props.placeholder === placeholder,
  );
  ReactTestRenderer.act(() => input.props.onChangeText(value));
}

function finishTaping(tree: any) {
  // InteractiveTapeStage reports tape progress via the (mocked) WebView onMessage
  const wv = tree.root.find(
    (n: any) => n.type === 'View' && typeof n.props.onMessage === 'function',
  );
  ReactTestRenderer.act(() =>
    wv.props.onMessage({
      nativeEvent: {
        data: JSON.stringify({
          count: 3,
          tapes: [{ face: 'front', x1: -70, y1: 0, x2: 70, y2: 0 }],
        }),
      },
    }),
  );
  return press(tree, '포장완료');
}

const has = (tree: any, s: string) =>
  tree.root
    .findAll((n: any) => n.type === 'Text')
    .some((n: any) => joinText(n.props.children).includes(s));

test('hides parcel locker entry points while logged out', async () => {
  let tree: any;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });

  expect(has(tree, '로그인')).toBe(true);
  expect(has(tree, '택배 보관함')).toBe(false);
  expect(has(tree, '소포 훔치기')).toBe(false);
});

test('every button click drives the expected navigation (no dead buttons)', async () => {
  jest.useFakeTimers();
  let tree: any;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });

  setInput(tree, 'email@example.com', 'user@example.com');
  setInput(tree, '비밀번호 8자 이상', 'password123');
  await press(tree, '로그인');

  // landing -> locker-grid via steal CTA
  expect(has(tree, '당신만의 고해성사')).toBe(true);
  await press(tree, '소포 훔치기');
  await ReactTestRenderer.act(async () => {
    await Promise.resolve();
  });
  expect(has(tree, '받고싶은 소포를 골라보세요')).toBe(true);
  await pressByA11y(tree, '뒤로');
  expect(has(tree, '당신만의 고해성사')).toBe(true);

  // landing -> letter-entry via send CTA
  await press(tree, '고해성사 보내기');
  expect(has(tree, 'To. 누군가')).toBe(true);

  // letter-entry: button gated by input, then -> loading-check -> pack-request
  setInput(
    tree,
    '고해성사를 적어보세요',
    '비밀이 있어요. 오늘은 API로 보냅니다.',
  );
  await press(tree, '다 적었어요');
  expect(has(tree, '박스를 확인하는 중')).toBe(true);
  ReactTestRenderer.act(() => jest.advanceTimersByTime(1500));
  expect(has(tree, '포장완료')).toBe(true); // pack-request tape stage

  // pack-request -> sealed -> confession -> loading-send -> locker-grid
  await finishTaping(tree);
  expect(has(tree, '포장이 끝났어요')).toBe(true);
  await press(tree, '계속');
  expect(has(tree, '우표를 찍었어요')).toBe(true);
  await press(tree, '발송하기');
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(1500);
    await Promise.resolve();
  });
  expect(has(tree, '받고싶은 소포를 골라보세요')).toBe(true);

  // locker-grid: pick a package -> locker-detail
  await press(tree, 'from.');
  expect(has(tree, '이 소포 열기')).toBe(true);

  // FIXED dead control #5: back arrow -> back to locker-grid
  await pressByA11y(tree, '뒤로');
  await ReactTestRenderer.act(async () => {
    await Promise.resolve();
  });
  expect(has(tree, '받고싶은 소포를 골라보세요')).toBe(true);

  // locker-detail -> tear-package, tap box x3 -> opened
  await press(tree, 'from.');
  await press(tree, '이 소포 열기');
  expect(has(tree, '소포를 뜯어주세요')).toBe(true);
  await pressBox(tree);
  await pressBox(tree);
  await pressBox(tree);
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(300);
    await Promise.resolve();
  });
  await press(tree, '편지 보기');

  // letter-read -> FIXED dead control #2: "답장 달기" -> attach-message
  expect(has(tree, 'To. 누군가')).toBe(true);
  await press(tree, '답장 달기');
  expect(has(tree, '택배에 글을 부착해보세요')).toBe(true);

  // attach -> label-complete -> repack -> result-ok
  setInput(tree, '받은 편지에 답장을 적어보세요', '괜찮아요');
  await press(tree, '송장 붙이기');
  expect(has(tree, '작성완료')).toBe(true);
  await press(tree, '작성완료');
  expect(has(tree, '포장완료')).toBe(true); // repack tape stage
  await finishTaping(tree);
  expect(has(tree, '우표를 찍었어요')).toBe(true);

  // result-ok -> back to locker-grid
  await press(tree, '보관함으로 돌아가기');
  await ReactTestRenderer.act(async () => {
    await Promise.resolve();
  });
  expect(has(tree, '받고싶은 소포를 골라보세요')).toBe(true);

  // RESET -> landing
  await pressByA11y(tree, '처음으로');
  expect(has(tree, '당신만의 고해성사')).toBe(true);

  await pressByA11y(tree, '로그아웃');
  expect(has(tree, '로그인')).toBe(true);
  expect(has(tree, '택배 보관함')).toBe(false);
  expect(has(tree, '소포 훔치기')).toBe(false);
  expect((globalThis.fetch as jest.Mock).mock.calls).toEqual(
    expect.arrayContaining([
      expect.arrayContaining([expect.stringContaining('/auth/logout')]),
    ]),
  );

  jest.useRealTimers();
});
