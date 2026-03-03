// Math.AI Constants

export const APP_NAME = 'Math.AI';
export const APP_TAGLINE = 'Your AI Math Companion';
export const APP_VERSION = '1.0.0';

// Free questions before sign-in required
export const FREE_QUESTION_LIMIT = 5;

// Trials per question before ad required
export const MAX_TRIALS_PER_QUESTION = 2;

// Loading delay to simulate AI (ms)
export const AI_LOADING_DELAY = 2000;

// Auto-scroll delay after correct answer (ms)
export const CORRECT_ANSWER_DELAY = 1500;

// Splash screen duration (ms)
export const SPLASH_DURATION = 3000;

// AdMob Unit IDs (test IDs — replace with real ones for production)
export const ADMOB_REWARD_AD_ID = 'ca-app-pub-3940256099942544/5224354917';

// Rank thresholds
export const RANK_TIERS = [
    { minScore: 0, title: 'Beginner', icon: 'school', color: '#8B93B0' },
    { minScore: 100, title: 'Thinker', icon: 'lightbulb-outline', color: '#FFD700' },
    { minScore: 300, title: 'Analyst', icon: 'trending-up', color: '#00D4AA' },
    { minScore: 600, title: 'Genius', icon: 'flash-on', color: '#6C63FF' },
    { minScore: 1000, title: 'Mastermind', icon: 'psychology', color: '#FF6B9D' },
    { minScore: 2000, title: 'Legendary', icon: 'auto-awesome', color: '#FF9800' },
    { minScore: 4000, title: 'Grandmaster', icon: 'emoji-events', color: '#E040FB' },
];

// Score calculation
export const CORRECT_ANSWER_POINTS = 10;
export const STREAK_BONUS_MULTIPLIER = 2;
export const WRONG_ANSWER_PENALTY = 2;

// AsyncStorage keys
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
