// AsyncStorage helper for tracking completed questions, user prefs, and scores

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

// ---- Completed Questions ----

export async function getCompletedQuestions(): Promise<string[]> {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export async function markQuestionCompleted(questionId: string): Promise<void> {
    try {
        const completed = await getCompletedQuestions();
        if (!completed.includes(questionId)) {
            completed.push(questionId);
            await AsyncStorage.setItem(
                STORAGE_KEYS.COMPLETED_QUESTIONS,
                JSON.stringify(completed),
            );
        }
    } catch (e) {
        console.warn('Failed to mark question completed:', e);
    }
}

export async function isQuestionCompleted(questionId: string): Promise<boolean> {
    const completed = await getCompletedQuestions();
    return completed.includes(questionId);
}

// ---- Theme Mode ----

export async function getThemeMode(): Promise<'dark' | 'light'> {
    try {
        const mode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
        return (mode as 'dark' | 'light') || 'dark';
    } catch {
        return 'dark';
    }
}

export async function setThemeMode(mode: 'dark' | 'light'): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
}

// ---- Sound ----

export async function getSoundEnabled(): Promise<boolean> {
    try {
        const val = await AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
        return val === null ? true : val === 'true';
    } catch {
        return true;
    }
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
}

// ---- Notifications ----

export async function getNotificationsEnabled(): Promise<boolean> {
    try {
        const val = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
        return val === null ? true : val === 'true';
    } catch {
        return true;
    }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(enabled));
}

// ---- Score ----

export async function getUserScore(): Promise<number> {
    try {
        const val = await AsyncStorage.getItem(STORAGE_KEYS.USER_SCORE);
        return val ? parseInt(val, 10) : 0;
    } catch {
        return 0;
    }
}

export async function setUserScore(score: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SCORE, String(score));
}

// ---- Streak ----

export async function getUserStreak(): Promise<number> {
    try {
        const val = await AsyncStorage.getItem(STORAGE_KEYS.USER_STREAK);
        return val ? parseInt(val, 10) : 0;
    } catch {
        return 0;
    }
}

export async function setUserStreak(streak: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_STREAK, String(streak));
}

// ---- Current Level (question index) ----

export async function getCurrentLevel(): Promise<number> {
    try {
        const val = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_LEVEL);
        return val ? parseInt(val, 10) : 1;
    } catch {
        return 1;
    }
}

export async function setCurrentLevel(level: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_LEVEL, String(level));
}
