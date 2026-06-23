import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppFlow from './src/AppFlow';
import './src/setupFontDefaults';

function App() {
  return (
    <SafeAreaProvider>
      <AppFlow />
    </SafeAreaProvider>
  );
}

export default App;
