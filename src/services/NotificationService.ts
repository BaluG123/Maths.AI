import { Alert, Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import i18n from '../i18n';

export interface NotificationPayload {
    title: string;
    body: string;
    userName?: string;
    language?: string;
}

class NotificationService {
    private isInitialized = false;

    /**
     * handler for background messages (needed by index.js)
     */
    async backgroundMessageHandler(remoteMessage: any) {
        console.log('[NotificationService] Message handled in the background!', JSON.stringify(remoteMessage));
    }

    /**
     * Start Firebase Messaging listeners & request permissions
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Android 13+ requires explicit POST_NOTIFICATIONS permission
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                    {
                        title: i18n.t('common.notifications.permission_title', { defaultValue: 'Notification Permission' }),
                        message: i18n.t('common.notifications.permission_message', { defaultValue: 'MathIQ needs permission to send you daily challenges and updates.' }),
                        buttonNeutral: i18n.t('common.maybe_later', { defaultValue: 'Maybe Later' }),
                        buttonNegative: i18n.t('common.cancel', { defaultValue: 'Cancel' }),
                        buttonPositive: i18n.t('common.save', { defaultValue: 'OK' }),
                    }
                );

                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('[NotificationService] Notification permission denied on Android');
                    return;
                }
            }

            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('[NotificationService] Authorization status:', authStatus);

                // Get FCM token for manual engagement
                const token = await messaging().getToken();
                console.log('[NotificationService] FCM Token:', token);

                // Foreground message handler
                messaging().onMessage(async remoteMessage => {
                    console.log('[NotificationService] A new FCM message arrived!', JSON.stringify(remoteMessage));
                    this.showLocalNotification({
                        title: remoteMessage.notification?.title || 'MathIQ',
                        body: remoteMessage.notification?.body || '',
                    });
                });

                // Background/Quit handler is usually handled via index.js or App.tsx but setup listener here for active sessions
                messaging().onNotificationOpenedApp(remoteMessage => {
                    console.log('[NotificationService] Notification caused app to open from background:', remoteMessage.notification);
                });

                this.isInitialized = true;
            }
        } catch (error) {
            console.error('[NotificationService] Initialization failed:', error);
        }
    }

    /**
     * Show a simulated/actual local notification
     * (Currently using Alert/Console as a bridge until a dedicated local notif library is added)
     */
    async showLocalNotification(payload: NotificationPayload) {
        const { title, body, userName } = payload;

        let message = body;
        if (userName) {
            message = message.replace('{name}', userName);
        }

        console.log(`[Notification] ${title}: ${message}`);

        if (__DEV__) {
            Alert.alert(title, message);
        }
    }

    /**
     * Schedule a daily IQ challenge reminder based on user's name & selected language
     */
    async scheduleDailyReminder(userName: string) {
        // We use the current i18n instance which holds the user's selected language
        const title = i18n.t('common.notifications.daily_title', { defaultValue: 'MathIQ Challenge' });
        const bodyTemplate = i18n.t('common.notifications.daily_body', {
            defaultValue: 'Hey {name}, ready to test your IQ today?'
        });

        const personalizedBody = bodyTemplate.replace('{name}', userName);

        console.log(`[Notification Scheduled] Daily reminder for ${userName} in "${i18n.language}" at 10:00 AM`);
        console.log(`[Scheduled Content] ${title}: ${personalizedBody}`);

        // Mock scheduling logic - usually requires react-native-push-notification or Expo Notifications
        // For now, we simulate by confirming it's "set" for the current UI language.
    }

    /**
     * Send welcome notification on sign-in
     */
    async sendWelcomeNotification(userName: string) {
        const title = i18n.t('common.notifications.welcome_title', { defaultValue: 'Welcome to MathIQ!' });
        const bodyTemplate = i18n.t('common.notifications.welcome_body', {
            defaultValue: 'Glad to have you with us, {name}. Let\'s solve some math!'
        });

        const personalizedBody = bodyTemplate.replace('{name}', userName);

        this.showLocalNotification({ title, body: personalizedBody });
    }
}

export default new NotificationService();
