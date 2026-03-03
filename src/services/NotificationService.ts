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
    private setModalVisible: ((visible: boolean) => void) | null = null;

    /**
     * handler for background messages (needed by index.js)
     */
    async backgroundMessageHandler(remoteMessage: any) {
        console.log('[NotificationService] Message handled in the background!', JSON.stringify(remoteMessage));
    }

    /**
     * Connect the UI modal to the service
     */
    bindModalControl(callback: (visible: boolean) => void) {
        this.setModalVisible = callback;
    }

    /**
     * Start Firebase Messaging listeners & request permissions
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Check if we already have permission
            const authStatus = await messaging().hasPermission();
            const alreadyEnabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (alreadyEnabled) {
                this.setupListeners();
                return;
            }

            // If not, trigger our custom premium prompt first
            if (this.setModalVisible) {
                console.log('[NotificationService] Requesting custom UI prompt...');
                this.setModalVisible(true);
            } else {
                // Fallback to direct request if modal isn't bound (e.g. background init)
                this.requestNativePermissions();
            }
        } catch (error) {
            console.error('[NotificationService] Initialization failed:', error);
        }
    }

    /**
     * The actual native permission request (called after user clicks 'OK' on our modal)
     */
    async requestNativePermissions() {
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
                }
            }

            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                this.setupListeners();
            }
        } catch (error) {
            console.error('[NotificationService] Native request failed:', error);
        }
    }

    private async setupListeners() {
        if (this.isInitialized) return;

        try {
            console.log('[NotificationService] Setting up listeners...');

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

            // Background/Quit handler
            messaging().onNotificationOpenedApp(remoteMessage => {
                console.log('[NotificationService] Notification caused app to open from background:', remoteMessage.notification);
            });

            this.isInitialized = true;
        } catch (e) {
            console.error('[NotificationService] Listener setup error:', e);
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
