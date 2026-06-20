const preset = require('@react-native/jest-preset/jest-preset');

module.exports = {
  ...preset,
  moduleNameMapper: {
    'react-native-webview': '<rootDir>/__mocks__/react-native-webview.js',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  watchman: false,
};
