// AdMob Reward Ad Service

import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

const REWARD_AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3940256099942544/5224354917';

let rewardedAd: RewardedAd | null = null;
let isAdLoaded = false;

/**
 * Load a reward ad (call this early so the ad is ready when needed)
 */
export function loadRewardAd(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            rewardedAd = RewardedAd.createForAdRequest(REWARD_AD_UNIT_ID, {
                keywords: ['math', 'education', 'puzzle', 'brain'],
            });

            const unsubscribeLoaded = rewardedAd.addAdEventListener(
                RewardedAdEventType.LOADED,
                () => {
                    isAdLoaded = true;
                    unsubscribeLoaded();
                    resolve();
                },
            );

            rewardedAd.load();

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!isAdLoaded) {
                    unsubscribeLoaded();
                    reject(new Error('Ad load timeout'));
                }
            }, 10000);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Show reward ad and return a promise that resolves when user earns the reward
 */
export function showRewardAd(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!rewardedAd || !isAdLoaded) {
            // Try loading a new one
            loadRewardAd()
                .then(() => showRewardAd().then(resolve).catch(reject))
                .catch(() => {
                    // If ad fails to load, grant reward anyway (graceful fallback)
                    resolve(true);
                });
            return;
        }

        try {
            const unsubscribeEarned = rewardedAd.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                () => {
                    unsubscribeEarned();
                    isAdLoaded = false;
                    // Pre-load next ad
                    loadRewardAd().catch(() => { });
                    resolve(true);
                },
            );

            rewardedAd.show();
        } catch (error) {
            isAdLoaded = false;
            reject(error);
        }
    });
}

/**
 * Check if a reward ad is ready to show
 */
export function isRewardAdReady(): boolean {
    return isAdLoaded;
}
