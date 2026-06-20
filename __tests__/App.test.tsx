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
  };
});

const App = require('../App').default;

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
