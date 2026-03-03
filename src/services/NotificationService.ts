// NotificationService — Logic for local & scheduled notifications
// NOTE: Since react-native-push-notification is not yet in package.json,
// this service acts as a bridge with console/alert logging to simulate behavior.

import { Alert, Platform } from 'react-native';
import i18n from '../i18n';

export interface NotificationPayload {
    title: string;
    body: string;
    userName?: string;
    language?: string;
}

class NotificationService {
    /**
     * Show a simulated local notification
     */
    async showLocalNotification(payload: NotificationPayload) {
        const { title, body, userName } = payload;

        // Personalize the body if userName is provided
        let message = body;
        if (userName) {
            message = message.replace('{name}', userName);
        }

        console.log(`[Notification] ${title}: ${message}`);

        // For demo purposes, we can show an Alert in DEV mode
        if (__DEV__) {
            Alert.alert(title, message);
        }
    }

    /**
     * Schedule a daily IQ challenge reminder
     */
    async scheduleDailyReminder(userName: string) {
        const title = i18n.t('notifications.daily_title', { defaultValue: 'MathIQ Challenge' });
        const body = i18n.t('notifications.daily_body', {
            name: userName,
            defaultValue: `Hey ${userName}, ready to test your IQ today?`
        });

        console.log(`[Notification Scheduled] Daily reminder for ${userName} at 10:00 AM`);
    }

    /**
     * Send welcome notification on sign-in
     */
    async sendWelcomeNotification(userName: string) {
        const title = i18n.t('notifications.welcome_title', { defaultValue: 'Welcome to MathIQ!' });
        const body = i18n.t('notifications.welcome_body', {
            name: userName,
            defaultValue: `Glad to have you with us, {name}. Let's solve some math!`
        });

        this.showLocalNotification({ title, body, userName });
    }

    /**
     * Send a test notification in the current language
     * To discard this entire notification logic later, simply delete this file (NotificationService.ts)
     * and remove references to it in AuthContext.tsx.
     */
    async sendTestNotification() {
        const title = i18n.t('notifications.test_title', { defaultValue: 'Test Notification' });
        const body = i18n.t('notifications.test_body', { defaultValue: 'This is a test notification for MathIQ!' });
        this.showLocalNotification({ title, body });
    }
}

export default new NotificationService();
