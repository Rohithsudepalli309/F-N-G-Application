/**
 * React Native entry point — registers the root component.
 * Metro bundler resolves this file first on both iOS and Android.
 */
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
