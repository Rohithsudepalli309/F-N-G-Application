import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { setBackgroundMessageHandler } from './src/utils/notifications';

// Register FCM background handler before AppRegistry (required by RN Firebase)
setBackgroundMessageHandler();

AppRegistry.registerComponent(appName, () => App);

