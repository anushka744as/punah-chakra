import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppDataProvider } from './src/data/AppDataContext';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <AppNavigator />
      </AppDataProvider>
    </SafeAreaProvider>
  );
}

export default App;
