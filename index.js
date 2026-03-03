/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import NotificationService from './src/services/NotificationService';

// Register background handler
messaging().setBackgroundMessageHandler(NotificationService.backgroundMessageHandler);

AppRegistry.registerComponent(appName, () => App);
