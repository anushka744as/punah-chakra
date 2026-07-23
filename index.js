/**
 * @format
 */

// ⚠️ MUST be the very first import — polyfills URL for Supabase on React Native
import 'react-native-url-polyfill/auto';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
