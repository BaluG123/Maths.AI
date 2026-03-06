// AdMob Service — Rewarded, Interstitial, and App Open ads
// Smart ad strategy: non-intrusive placement at natural break points

import {
    RewardedAd,
    RewardedAdEventType,
    InterstitialAd,
    AdEventType,
    AppOpenAd,
    TestIds,
} from 'react-native-google-mobile-ads';

import {
    ADMOB_REWARD_AD_ID,
    ADMOB_INTERSTITIAL_AD_ID,
    ADMOB_APP_OPEN_AD_ID,
} from '../utils/constants';

const REWARD_AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : ADMOB_REWARD_AD_ID;
const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : ADMOB_INTERSTITIAL_AD_ID;
const APP_OPEN_AD_UNIT_ID = __DEV__ ? TestIds.APP_OPEN : ADMOB_APP_OPEN_AD_ID;

// ─── Rewarded Ad ────────────────────────────────────────────────

let rewardedAd: RewardedAd | null = null;
let isRewardedLoaded = false;

export function loadRewardAd(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            rewardedAd = RewardedAd.createForAdRequest(REWARD_AD_UNIT_ID, {
                keywords: ['math', 'education', 'puzzle', 'brain'],
            });

            const unsubscribeLoaded = rewardedAd.addAdEventListener(
                RewardedAdEventType.LOADED,
                () => {
                    isRewardedLoaded = true;
                    unsubscribeLoaded();
                    resolve();
                },
            );

            rewardedAd.load();

            setTimeout(() => {
                if (!isRewardedLoaded) {
                    unsubscribeLoaded();
                    reject(new Error('Ad load timeout'));
                }
            }, 10000);
        } catch (error) {
            reject(error);
        }
    });
}

export function showRewardAd(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!rewardedAd || !isRewardedLoaded) {
            loadRewardAd()
                .then(() => showRewardAd().then(resolve).catch(reject))
                .catch(() => {
                    resolve(true); // Graceful fallback
                });
            return;
        }

        try {
            const unsubscribeEarned = rewardedAd.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                () => {
                    unsubscribeEarned();
                    isRewardedLoaded = false;
                    loadRewardAd().catch(() => { });
                    resolve(true);
                },
            );

            rewardedAd.show();
        } catch (error) {
            isRewardedLoaded = false;
            reject(error);
        }
    });
}

export function isRewardAdReady(): boolean {
    return isRewardedLoaded;
}

// ─── Interstitial Ad ────────────────────────────────────────────

let interstitialAd: InterstitialAd | null = null;
let isInterstitialLoaded = false;

export function loadInterstitialAd(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
                keywords: ['math', 'education', 'puzzle', 'brain'],
            });

            const unsubLoaded = interstitialAd.addAdEventListener(
                AdEventType.LOADED,
                () => {
                    isInterstitialLoaded = true;
                    unsubLoaded();
                    resolve();
                },
            );

            const unsubClosed = interstitialAd.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    isInterstitialLoaded = false;
                    unsubClosed();
                    // Pre-load next one silently
                    loadInterstitialAd().catch(() => { });
                },
            );

            interstitialAd.load();

            setTimeout(() => {
                if (!isInterstitialLoaded) {
                    unsubLoaded();
                    reject(new Error('Interstitial ad load timeout'));
                }
            }, 10000);
        } catch (error) {
            reject(error);
        }
    });
}

export function showInterstitialAd(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!interstitialAd || !isInterstitialLoaded) {
            // Skip gracefully — don't block the user
            resolve();
            return;
        }

        try {
            const unsubClosed = interstitialAd.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    unsubClosed();
                    isInterstitialLoaded = false;
                    loadInterstitialAd().catch(() => { });
                    resolve();
                },
            );

            interstitialAd.show();
        } catch (error) {
            isInterstitialLoaded = false;
            resolve(); // Don't block on failure
        }
    });
}

// ─── App Open Ad ────────────────────────────────────────────────

let appOpenAd: AppOpenAd | null = null;
let isAppOpenLoaded = false;
let appOpenLoadTime = 0;
const APP_OPEN_AD_EXPIRY = 4 * 60 * 60 * 1000; // 4 hours

export function loadAppOpenAd(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            appOpenAd = AppOpenAd.createForAdRequest(APP_OPEN_AD_UNIT_ID, {
                keywords: ['math', 'education', 'puzzle', 'brain'],
            });

            const unsubLoaded = appOpenAd.addAdEventListener(
                AdEventType.LOADED,
                () => {
                    isAppOpenLoaded = true;
                    appOpenLoadTime = Date.now();
                    unsubLoaded();
                    resolve();
                },
            );

            const unsubClosed = appOpenAd.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    isAppOpenLoaded = false;
                    unsubClosed();
                    loadAppOpenAd().catch(() => { });
                },
            );

            appOpenAd.load();

            setTimeout(() => {
                if (!isAppOpenLoaded) {
                    unsubLoaded();
                    reject(new Error('App Open ad load timeout'));
                }
            }, 10000);
        } catch (error) {
            reject(error);
        }
    });
}

export function showAppOpenAd(): Promise<void> {
    return new Promise((resolve) => {
        // Check if ad is loaded and not expired
        if (!appOpenAd || !isAppOpenLoaded) {
            resolve();
            return;
        }

        // Don't show stale ads (over 4 hours old)
        if (Date.now() - appOpenLoadTime > APP_OPEN_AD_EXPIRY) {
            isAppOpenLoaded = false;
            loadAppOpenAd().catch(() => { });
            resolve();
            return;
        }

        try {
            const unsubClosed = appOpenAd.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    unsubClosed();
                    isAppOpenLoaded = false;
                    loadAppOpenAd().catch(() => { });
                    resolve();
                },
            );

            appOpenAd.show();
        } catch (error) {
            isAppOpenLoaded = false;
            resolve();
        }
    });
}
