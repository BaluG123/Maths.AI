// MathIQ Constants

export const APP_NAME = 'MathIQ';
export const APP_TAGLINE = 'Sharpen Your Mind. Test Your IQ.';
export const APP_VERSION = '1.0.0';

// Free questions before sign-in required
export const FREE_QUESTION_LIMIT = 5;

// Trials per question before ad required
export const MAX_TRIALS_PER_QUESTION = 2;

// Loading delay for question transition (ms)
export const LOADING_DELAY = 2000;

// Auto-scroll delay after correct answer (ms)
export const CORRECT_ANSWER_DELAY = 1500;

// Splash screen duration (ms)
export const SPLASH_DURATION = 3000;

// AdMob Unit IDs (test IDs — replace with real ones for production)
export const ADMOB_REWARD_AD_ID = 'ca-app-pub-2627956667785383/1005088037';
export const ADMOB_INTERSTITIAL_AD_ID = 'ca-app-pub-2627956667785383/9497346211';
export const ADMOB_APP_OPEN_AD_ID = 'ca-app-pub-2627956667785383/6623770866';
export const ADMOB_BANNER_AD_ID = 'ca-app-pub-2627956667785383/5310689196';

// Show interstitial ad every N questions (natural break)
export const INTERSTITIAL_FREQUENCY = 5;

// Rank thresholds
export const RANK_TIERS = [
    { minScore: 0, title: 'Beginner', icon: 'school', color: '#8B93B0' },
    { minScore: 100, title: 'Thinker', icon: 'lightbulb-outline', color: '#FFD700' },
    { minScore: 300, title: 'Analyst', icon: 'trending-up', color: '#00D4AA' },
    { minScore: 600, title: 'Genius', icon: 'flash-on', color: '#6C63FF' },
    { minScore: 1000, title: 'Mastermind', icon: 'emoji-events', color: '#FF6B9D' },
    { minScore: 2000, title: 'Legendary', icon: 'auto-awesome', color: '#FF9800' },
    { minScore: 4000, title: 'Grandmaster', icon: 'workspace-premium', color: '#E040FB' },
];

// Score calculation
export const CORRECT_ANSWER_POINTS = 10;
export const STREAK_BONUS_MULTIPLIER = 2;
export const WRONG_ANSWER_PENALTY = 2;

// AsyncStorage keys (keep @mathai prefix to preserve user data)
export const STORAGE_KEYS = {
    COMPLETED_QUESTIONS: '@mathai_completed_questions',
    THEME_MODE: '@mathai_theme_mode',
    SOUND_ENABLED: '@mathai_sound_enabled',
    NOTIFICATIONS_ENABLED: '@mathai_notifications_enabled',
    USER_SCORE: '@mathai_user_score',
    USER_STREAK: '@mathai_user_streak',
    CURRENT_LEVEL: '@mathai_current_level',
};

// Question categories
export const CATEGORIES = [
    'Number Series',
    'Pattern Recognition',
    'Arithmetic',
    'Algebra',
    'Geometry',
    'Logic',
    'Probability',
    'Sequences',
    'Math Tricks',
    'Brain Teasers',
];
