// Firebase Firestore Service — Ranking system

import firestore from '@react-native-firebase/firestore';

export interface UserRanking {
    userId: string;
    displayName: string;
    photoURL: string;
    email: string;
    score: number;
    questionsAnswered: number;
    correctAnswers: number;
    streak: number;
    lastUpdated: Date;
}

const RANKINGS_COLLECTION = 'rankings';

/**
 * Save or update user score in Firestore
 */
export async function saveUserScore(
    userId: string,
    displayName: string,
    photoURL: string,
    email: string,
    score: number,
    questionsAnswered: number,
    correctAnswers: number,
    streak: number,
): Promise<void> {
    try {
        await firestore().collection(RANKINGS_COLLECTION).doc(userId).set(
            {
                userId,
                displayName,
                photoURL,
                email,
                score,
                questionsAnswered,
                correctAnswers,
                streak,
                lastUpdated: firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
        );
    } catch (error) {
        console.error('Error saving user score:', error);
    }
}

/**
 * Get leaderboard (top N users sorted by score)
 */
export async function getLeaderboard(limit: number = 50): Promise<UserRanking[]> {
    try {
        const snapshot = await firestore()
            .collection(RANKINGS_COLLECTION)
            .orderBy('score', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            ...doc.data(),
            lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        })) as UserRanking[];
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

/**
 * Get a specific user's rank position
 */
export async function getUserRank(userId: string): Promise<{ rank: number; data: UserRanking | null }> {
    try {
        // Get user data
        const userDoc = await firestore().collection(RANKINGS_COLLECTION).doc(userId).get();
        if (!userDoc.exists) {
            return { rank: 0, data: null };
        }

        const userData = userDoc.data() as UserRanking;
        const userScore = userData.score || 0;

        // Count how many users have higher scores
        const higherScores = await firestore()
            .collection(RANKINGS_COLLECTION)
            .where('score', '>', userScore)
            .count()
            .get();

        const rank = (higherScores.data().count || 0) + 1;

        return {
            rank,
            data: {
                ...userData,
                lastUpdated: (userData as any).lastUpdated?.toDate?.() || new Date(),
            },
        };
    } catch (error) {
        console.error('Error fetching user rank:', error);
        return { rank: 0, data: null };
    }
}
/**
 * Delete user data from Firestore
 */
export async function deleteUserData(userId: string): Promise<void> {
    try {
        await firestore().collection(RANKINGS_COLLECTION).doc(userId).delete();
    } catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
}
