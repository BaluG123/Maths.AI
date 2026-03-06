// QuestionScreen — Premium horizontal-swipe quiz with glassmorphism UI
// Features: per-page horizontal scroll, animated cards, interstitial ads, reward ad, sign-in gate
// Polish: celebration overlay, encouragement toast, heart lives, auto-hint, rate app

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Alert,
    Modal,
    Animated,
    Easing,
    Platform,
    Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import LoadingOverlay from '../components/LoadingOverlay';
import ProfileAvatar from '../components/ProfileAvatar';
import OptionButton from '../components/OptionButton';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useTranslation } from 'react-i18next';
import {
    FREE_QUESTION_LIMIT,
    MAX_TRIALS_PER_QUESTION,
    LOADING_DELAY,
    CORRECT_ANSWER_DELAY,
    CORRECT_ANSWER_POINTS,
    WRONG_ANSWER_PENALTY,
    STREAK_BONUS_MULTIPLIER,
    INTERSTITIAL_FREQUENCY,
} from '../utils/constants';
import {
    getCompletedQuestions,
    markQuestionCompleted,
    getUserScore,
    setUserScore,
    getUserStreak,
    setUserStreak,
} from '../utils/storageHelper';
import { saveUserScore } from '../services/firebaseService';
import { showRewardAd, loadRewardAd, loadInterstitialAd, showInterstitialAd } from '../services/adService';
import questionsData from '../data/questions.json';

const { width, height } = Dimensions.get('window');

// Lazy-load localized questions & build O(1) lookup map
let _localizedMap: Map<string, any> | null = null;
function getLocalizedMap(): Map<string, any> {
    if (!_localizedMap) {
        try {
            const data = require('../data/localized_questions.json');
            _localizedMap = new Map();
            for (const item of data) {
                _localizedMap.set(item.id, item);
            }
        } catch {
            _localizedMap = new Map();
        }
    }
    return _localizedMap;
}

interface Question {
    id: string;
    category: string;
    difficulty: string;
    question: string;
    options: string[];
    correctIndex: number;
    hint: string;
    solution: string;
    explanation: string;
}

type OptionState = 'default' | 'correct' | 'wrong' | 'selected';

// Encouraging messages after wrong answer
const ENCOURAGEMENTS = [
    "Almost! Give it another shot 💪",
    "So close! Think again 🧠",
    "Not quite — you've got this! 🎯",
    "Keep trying, you're learning! 📚",
    "Good attempt! Try once more 🔥",
];

// Celebration messages on correct answer
const CELEBRATIONS = [
    "Brilliant! 🎉",
    "Genius move! 🧠✨",
    "Nailed it! 🎯",
    "Perfect! 💫",
    "Outstanding! 🏆",
    "You're on fire! 🔥",
    "Incredible! ⚡",
];

// Rate app milestones
const RATE_APP_MILESTONES = [10, 25, 50];

export default function QuestionScreen({ navigation }: any) {
    const { t, i18n } = useTranslation();
    const { colors } = useTheme();
    const { user, isSignedIn, signInWithGoogle } = useAuth();
    const { playCorrectSound, playWrongSound, playLevelUpSound } = useSound();
    const flatListRef = useRef<FlatList>(null);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [trials, setTrials] = useState<{ [key: string]: number }>({});
    const [optionStates, setOptionStates] = useState<{ [key: string]: OptionState[] }>({});
    const [showHint, setShowHint] = useState<{ [key: string]: boolean }>({});
    const [showSolution, setShowSolution] = useState<{ [key: string]: boolean }>({});
    const [answered, setAnswered] = useState<{ [key: string]: boolean }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [levelNumber, setLevelNumber] = useState(1);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);

    // Feedback overlays
    const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [pointsEarned, setPointsEarned] = useState(0);

    // Animations
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const scoreScale = useRef(new Animated.Value(1)).current;
    const streakBounce = useRef(new Animated.Value(1)).current;
    const cardEntrance = useRef(new Animated.Value(0)).current;
    const levelGlow = useRef(new Animated.Value(0.4)).current;
    const dotScale = useRef(new Animated.Value(1)).current;
    const feedbackOpacity = useRef(new Animated.Value(0)).current;
    const feedbackScale = useRef(new Animated.Value(0.5)).current;
    const feedbackSlide = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        initQuestions();
        loadRewardAd().catch(() => { });
        loadInterstitialAd().catch(() => { });

        Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Pulsing level glow
        Animated.loop(
            Animated.sequence([
                Animated.timing(levelGlow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(levelGlow, { toValue: 0.4, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
        ).start();

        // Pulsing dot
        Animated.loop(
            Animated.sequence([
                Animated.timing(dotScale, { toValue: 1.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(dotScale, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
        ).start();
    }, []);

    const animateCardEntrance = () => {
        cardEntrance.setValue(0);
        Animated.spring(cardEntrance, {
            toValue: 1,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        animateCardEntrance();
    }, [currentIndex]);

    const initQuestions = async () => {
        const completed = await getCompletedQuestions();
        const allQuestions = (questionsData as Question[]).filter(
            q => !completed.includes(q.id),
        );
        setQuestions(allQuestions);

        const s = await getUserScore();
        setScore(s);
        const st = await getUserStreak();
        setStreak(st);
        setLevelNumber(completed.length + 1);
    };

    const animateScore = () => {
        Animated.sequence([
            Animated.timing(scoreScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
            Animated.spring(scoreScale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
        ]).start();
    };

    const animateStreak = () => {
        Animated.sequence([
            Animated.timing(streakBounce, { toValue: 1.4, duration: 200, useNativeDriver: true }),
            Animated.spring(streakBounce, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
        ]).start();
    };

    // ─── Feedback Toast ─────────────────────────────────────────

    const showFeedback = (type: 'correct' | 'wrong', message: string, points?: number) => {
        setFeedbackType(type);
        setFeedbackMessage(message);
        setPointsEarned(points || 0);

        feedbackOpacity.setValue(0);
        feedbackScale.setValue(0.5);
        feedbackSlide.setValue(50);

        Animated.parallel([
            Animated.spring(feedbackOpacity, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
            Animated.spring(feedbackScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
            Animated.spring(feedbackSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        ]).start();

        // Auto-dismiss
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(feedbackOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(feedbackSlide, { toValue: -30, duration: 300, useNativeDriver: true }),
            ]).start(() => {
                setFeedbackType(null);
            });
        }, type === 'correct' ? 1200 : 1800);
    };

    // ─── Rate App ───────────────────────────────────────────────

    const maybeShowRateApp = (totalAnswered: number) => {
        if (RATE_APP_MILESTONES.includes(totalAnswered)) {
            setTimeout(() => {
                Alert.alert(
                    '⭐ Enjoying MathIQ?',
                    `You've solved ${totalAnswered} questions! Would you like to rate us on the Play Store?`,
                    [
                        { text: 'Later', style: 'cancel' },
                        {
                            text: 'Rate Now ⭐',
                            onPress: () => {
                                // Replace with your actual package name
                                Linking.openURL('https://play.google.com/store/apps/details?id=com.devuniverse').catch(() => { });
                            },
                        },
                    ],
                );
            }, 2000);
        }
    };

    const handleOptionPress = useCallback(
        (questionId: string, optionIndex: number, correctIndex: number) => {
            if (answered[questionId]) return;

            const currentTrials = (trials[questionId] || 0) + 1;
            const isCorrect = optionIndex === correctIndex;

            const states = [...(optionStates[questionId] || ['default', 'default', 'default', 'default'])];
            if (isCorrect) {
                states[optionIndex] = 'correct';
            } else {
                states[optionIndex] = 'wrong';
            }

            setOptionStates(prev => ({ ...prev, [questionId]: states }));
            setTrials(prev => ({ ...prev, [questionId]: currentTrials }));

            if (isCorrect) {
                playCorrectSound();
                setAnswered(prev => ({ ...prev, [questionId]: true }));

                const streakBonus = streak > 0 ? streak * STREAK_BONUS_MULTIPLIER : 0;
                const earnedPoints = CORRECT_ANSWER_POINTS + streakBonus;
                const newScore = score + earnedPoints;
                const newStreak = streak + 1;
                const newAnswered = questionsAnswered + 1;
                setScore(newScore);
                setStreak(newStreak);
                setUserScore(newScore);
                setUserStreak(newStreak);
                markQuestionCompleted(questionId);
                setQuestionsAnswered(newAnswered);

                animateScore();
                animateStreak();

                // 🎉 Celebration feedback
                const msg = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
                showFeedback('correct', msg, earnedPoints);

                // Rate app prompt at milestones
                maybeShowRateApp(newAnswered);

                if (isSignedIn && user) {
                    saveUserScore(
                        user.uid,
                        user.displayName || '',
                        user.photoURL || '',
                        user.email || '',
                        newScore,
                        levelNumber,
                        levelNumber,
                        newStreak,
                    ).catch(() => { });
                }

                setTimeout(() => {
                    moveToNextQuestion();
                }, CORRECT_ANSWER_DELAY);
            } else {
                playWrongSound();
                setStreak(0);
                setUserStreak(0);

                const newScore = Math.max(0, score - WRONG_ANSWER_PENALTY);
                setScore(newScore);
                setUserScore(newScore);

                // 💡 Auto-reveal hint after first wrong attempt
                if (currentTrials === 1) {
                    setShowHint(prev => ({ ...prev, [questionId]: true }));
                }

                // 💪 Encouragement feedback
                if (currentTrials < MAX_TRIALS_PER_QUESTION) {
                    const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
                    showFeedback('wrong', msg);
                }

                if (currentTrials >= MAX_TRIALS_PER_QUESTION) {
                    setAnswered(prev => ({ ...prev, [questionId]: true }));
                    showFeedback('wrong', "No worries! Watch the solution 📖");
                }
            }
        },
        [answered, trials, optionStates, score, streak, levelNumber, isSignedIn, user, playCorrectSound, playWrongSound, questionsAnswered],
    );

    const moveToNextQuestion = async () => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= questions.length || nextIndex >= 1000) {
            Alert.alert(t('quiz.congrats'), t('quiz.completed_all'), [
                { text: t('common.back'), onPress: () => navigation.goBack() },
            ]);
            return;
        }

        const nextLevel = levelNumber + 1;
        setLevelNumber(nextLevel);

        if (nextLevel > FREE_QUESTION_LIMIT && !isSignedIn) {
            setShowSignInModal(true);
            return;
        }

        // Show interstitial ad at natural break points
        if (questionsAnswered > 0 && questionsAnswered % INTERSTITIAL_FREQUENCY === 0) {
            try {
                await showInterstitialAd();
            } catch {
                // Don't block on ad failure
            }
        }

        setIsLoading(true);
        setCurrentIndex(nextIndex);

        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        }, 100);

        setTimeout(() => {
            setIsLoading(false);
            playLevelUpSound();
        }, LOADING_DELAY);
    };

    const handleWatchAd = async (questionId: string) => {
        try {
            const rewarded = await showRewardAd();
            if (rewarded) {
                setShowSolution(prev => ({ ...prev, [questionId]: true }));
            }
        } catch {
            setShowSolution(prev => ({ ...prev, [questionId]: true }));
        }
    };

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
            setShowSignInModal(false);
            moveToNextQuestion();
        } catch (error) {
            Alert.alert(t('common.signin_failed'), t('common.try_again'));
        }
    };

    const getDifficultyConfig = (difficulty: string) => {
        switch (difficulty) {
            case 'hard':
                return { color: colors.wrong, bg: colors.wrongBg, label: '🔥 Hard' };
            case 'medium':
                return { color: '#FFC107', bg: 'rgba(255, 193, 7, 0.15)', label: '⚡ Medium' };
            default:
                return { color: colors.correct, bg: colors.correctBg, label: '🌱 Easy' };
        }
    };

    // Progress dots (show up to 7 dots around current question)
    const progressDots = useMemo(() => {
        const total = Math.min(questions.length, 1000);
        const maxVisible = 7;
        let start = Math.max(0, currentIndex - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible);
        if (end - start < maxVisible) {
            start = Math.max(0, end - maxVisible);
        }
        return { start, end, total };
    }, [currentIndex, questions.length]);

    const renderQuestionItem = useCallback(({ item, index }: { item: Question; index: number }) => {
        const questionTrials = trials[item.id] || 0;
        const questionAnswered = answered[item.id] || false;
        const questionOptionStates = optionStates[item.id] || ['default', 'default', 'default', 'default'];
        const hintVisible = showHint[item.id] || false;
        const solutionVisible = showSolution[item.id] || false;
        const triedMaxAndFailed = questionTrials >= MAX_TRIALS_PER_QUESTION && !questionOptionStates.includes('correct');
        const isActive = index === currentIndex;
        const diffConfig = getDifficultyConfig(item.difficulty);

        // Localization
        const currentLang = i18n.language;
        let localizedData = null;
        if (currentLang !== 'en') {
            const map = getLocalizedMap();
            localizedData = map.get(item.id)?.[currentLang] || null;
        }

        const displayQuestion = localizedData?.question || item.question;
        const displayOptions = localizedData?.options || item.options;
        const displayHint = localizedData?.hint || item.hint;
        const displaySolution = localizedData?.solution || item.solution;
        const displayExplanation = localizedData?.explanation || item.explanation;

        return (
            <View style={[styles.pageContainer, { width }]}>
                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                    contentContainerStyle={styles.pageScroll}
                    style={{
                        opacity: isActive ? cardEntrance.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 1],
                        }) : 1,
                        transform: isActive ? [{
                            translateY: cardEntrance.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                            }),
                        }] : [],
                    }}
                >
                    {/* Question Number + Difficulty Header */}
                    <View style={styles.questionHeader}>
                        <View style={styles.qNumberContainer}>
                            <Text style={[styles.qNumberLabel, { color: colors.textMuted }]}>QUESTION</Text>
                            <Text style={[styles.qNumber, { color: colors.primary }]}>
                                {levelNumber + (index - currentIndex)}
                            </Text>
                        </View>
                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: colors.primaryGlow }]}>
                                <Icon name="category" size={12} color={colors.primary} />
                                <Text style={[styles.badgeText, { color: colors.primary }]}>{item.category}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: diffConfig.bg }]}>
                                <Text style={[styles.badgeText, { color: diffConfig.color }]}>{diffConfig.label}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Glassmorphism Question Card */}
                    <View style={[styles.glassCard, {
                        backgroundColor: Platform.OS === 'ios'
                            ? 'rgba(255, 255, 255, 0.06)'
                            : colors.surfaceElevated,
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        shadowColor: colors.primary,
                    }]}>
                        <View style={[styles.cardAccentBar, { backgroundColor: diffConfig.color }]} />
                        <Text style={[styles.questionText, { color: colors.text }]}>
                            {displayQuestion}
                        </Text>
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {displayOptions.map((option: string, optIdx: number) => (
                            <OptionButton
                                key={optIdx}
                                label={option}
                                index={optIdx}
                                onPress={() => handleOptionPress(item.id, optIdx, item.correctIndex)}
                                disabled={questionAnswered || questionOptionStates[optIdx] === 'wrong'}
                                state={questionOptionStates[optIdx] as OptionState}
                            />
                        ))}
                    </View>

                    {/* ❤️ Heart-based Lives Indicator */}
                    <View style={styles.livesRow}>
                        <View style={styles.heartsContainer}>
                            {Array.from({ length: MAX_TRIALS_PER_QUESTION }).map((_, i) => (
                                <View key={i} style={styles.heartWrapper}>
                                    <Icon
                                        name={i < (MAX_TRIALS_PER_QUESTION - questionTrials) ? 'favorite' : 'favorite-border'}
                                        size={22}
                                        color={i < (MAX_TRIALS_PER_QUESTION - questionTrials) ? '#FF4D6D' : colors.border}
                                    />
                                </View>
                            ))}
                        </View>
                        <Text style={[styles.livesText, { color: colors.textMuted }]}>
                            {MAX_TRIALS_PER_QUESTION - questionTrials} {MAX_TRIALS_PER_QUESTION - questionTrials === 1 ? 'life' : 'lives'} left
                        </Text>
                    </View>

                    {/* Hint — auto-revealed after first wrong, or user can tap */}
                    {!hintVisible && questionTrials === 0 && (
                        <TouchableOpacity
                            onPress={() => setShowHint(prev => ({ ...prev, [item.id]: true }))}
                            style={[styles.hintButton, {
                                borderColor: colors.secondary,
                                backgroundColor: 'rgba(0, 212, 170, 0.05)',
                            }]}>
                            <Icon name="lightbulb-outline" size={18} color={colors.secondary} />
                            <Text style={[styles.hintButtonText, { color: colors.secondary }]}>{t('quiz.show_hint')}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Hint card — visible after user taps or after first wrong answer */}
                    {hintVisible && (
                        <View style={[styles.hintCard, {
                            backgroundColor: colors.secondaryGlow,
                            borderColor: colors.secondary,
                        }]}>
                            <View style={styles.hintIconContainer}>
                                <Icon name="lightbulb" size={20} color={colors.secondary} />
                            </View>
                            <View style={styles.hintTextContainer}>
                                <Text style={[styles.hintLabel, { color: colors.secondary }]}>💡 Hint</Text>
                                <Text style={[styles.hintText, { color: colors.text }]}>{displayHint}</Text>
                            </View>
                        </View>
                    )}

                    {/* Watch Ad button */}
                    {triedMaxAndFailed && !solutionVisible && (
                        <TouchableOpacity
                            onPress={() => handleWatchAd(item.id)}
                            style={[styles.adButton, { backgroundColor: colors.accent }]}>
                            <Icon name="play-circle-outline" size={22} color="#FFFFFF" />
                            <Text style={styles.adButtonText}>{t('quiz.watch_ad')}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Solution & Explanation */}
                    {(solutionVisible || questionOptionStates.includes('correct')) && (
                        <View style={[styles.solutionCard, {
                            backgroundColor: colors.correctBg,
                            borderColor: colors.correct,
                        }]}>
                            <View style={styles.solutionHeader}>
                                <Icon name="verified" size={20} color={colors.correct} />
                                <Text style={[styles.solutionTitle, { color: colors.correct }]}>{t('quiz.solution')}</Text>
                            </View>
                            <Text style={[styles.solutionText, { color: colors.text }]}>{t('quiz.answer')}: {displaySolution}</Text>
                            <Text style={[styles.explanationText, { color: colors.textSecondary }]}>{displayExplanation}</Text>

                            {triedMaxAndFailed && solutionVisible && (
                                <TouchableOpacity
                                    onPress={moveToNextQuestion}
                                    style={[styles.nextButton, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.nextButtonText}>{t('quiz.next')}</Text>
                                    <Icon name="arrow-forward" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </Animated.ScrollView>
            </View>
        );
    }, [trials, answered, optionStates, showHint, showSolution, currentIndex, levelNumber, colors, i18n.language, cardEntrance]);

    return (
        <GradientBackground>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <View style={[styles.backButtonBg, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                        <Icon name="arrow-back-ios" size={18} color={colors.text} style={{ marginLeft: 4 }} />
                    </View>
                </TouchableOpacity>

                {/* Animated Level Badge */}
                <View style={styles.levelBadge}>
                    <Animated.View style={[styles.levelGlowRing, {
                        borderColor: colors.primary,
                        opacity: levelGlow,
                    }]} />
                    <View style={[styles.levelInner, { backgroundColor: colors.primaryGlow }]}>
                        <Text style={[styles.levelText, { color: colors.textMuted }]}>{t('quiz.level')}</Text>
                        <Text style={[styles.levelNumber, { color: colors.primary }]}>{levelNumber}</Text>
                    </View>
                </View>

                {/* Score with animation */}
                <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scoreScale }] }]}>
                    <Icon name="star" size={16} color={colors.secondary} />
                    <Text style={[styles.scoreText, { color: colors.text }]}>{score}</Text>
                </Animated.View>

                {/* Streak with bounce */}
                {streak > 0 && (
                    <Animated.View style={[styles.streakBadge, {
                        backgroundColor: colors.wrongBg,
                        transform: [{ scale: streakBounce }],
                    }]}>
                        <Text style={styles.streakText}>🔥 {streak}</Text>
                    </Animated.View>
                )}

                <ProfileAvatar onPress={() => navigation.navigate('Settings')} size={34} />
            </Animated.View>

            {/* Animated Step-Dot Progress */}
            <View style={styles.progressContainer}>
                {Array.from({ length: progressDots.end - progressDots.start }).map((_, i) => {
                    const dotIndex = progressDots.start + i;
                    const isCurrent = dotIndex === currentIndex;
                    const isPast = dotIndex < currentIndex;
                    return (
                        <View key={dotIndex} style={styles.dotWrapper}>
                            {isCurrent ? (
                                <Animated.View style={[
                                    styles.dot,
                                    styles.dotCurrent,
                                    {
                                        backgroundColor: colors.primary,
                                        transform: [{ scale: dotScale }],
                                        shadowColor: colors.primary,
                                    },
                                ]} />
                            ) : (
                                <View style={[
                                    styles.dot,
                                    {
                                        backgroundColor: isPast ? colors.correct : colors.border,
                                        opacity: isPast ? 0.7 : 0.3,
                                    },
                                ]} />
                            )}
                        </View>
                    );
                })}
                <Text style={[styles.progressText, { color: colors.textMuted }]}>
                    {currentIndex + 1}/{Math.min(questions.length, 1000)}
                </Text>
            </View>

            {/* Horizontal FlatList — One question per page */}
            <FlatList
                ref={flatListRef}
                data={questions.slice(0, 1000)}
                renderItem={renderQuestionItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={0}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
                style={styles.flatList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={5}
            />

            {/* ── Feedback Toast Overlay ── */}
            {feedbackType && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.feedbackOverlay,
                        {
                            opacity: feedbackOpacity,
                            transform: [{ scale: feedbackScale }, { translateY: feedbackSlide }],
                        },
                    ]}
                >
                    <View style={[
                        styles.feedbackCard,
                        {
                            backgroundColor: feedbackType === 'correct'
                                ? 'rgba(0, 230, 118, 0.95)'
                                : 'rgba(255, 82, 82, 0.92)',
                        },
                    ]}>
                        <Icon
                            name={feedbackType === 'correct' ? 'celebration' : 'sentiment-dissatisfied'}
                            size={28}
                            color="#FFF"
                        />
                        <View style={styles.feedbackTextContainer}>
                            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
                            {feedbackType === 'correct' && pointsEarned > 0 && (
                                <Text style={styles.feedbackPoints}>+{pointsEarned} pts</Text>
                            )}
                        </View>
                    </View>
                </Animated.View>
            )}

            {/* Smart Loading */}
            <LoadingOverlay visible={isLoading} />

            {/* Sign-In Modal */}
            <Modal visible={showSignInModal} transparent animationType="fade">
                <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                        <View style={[styles.modalIconWrapper, { backgroundColor: colors.primaryGlow }]}>
                            <Icon name="lock-open" size={40} color={colors.primary} />
                        </View>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {t('common.unlock')}
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            {t('common.unlock_desc')}
                        </Text>
                        <TouchableOpacity onPress={handleSignIn} style={styles.googleButton}>
                            <Icon name="login" size={22} color="#FFFFFF" />
                            <Text style={styles.googleButtonText}>{t('common.signin')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setShowSignInModal(false); navigation.goBack(); }}>
                            <Text style={[styles.laterText, { color: colors.textMuted }]}>{t('common.maybe_later')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    // ─── Header ─────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 10,
        gap: 10,
    },
    backButton: {
        padding: 4,
    },
    backButtonBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    levelGlowRing: {
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
    },
    levelInner: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    levelText: {
        fontSize: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    levelNumber: {
        fontSize: 18,
        fontWeight: '900',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 'auto',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    scoreText: {
        fontSize: 15,
        fontWeight: '700',
    },
    streakBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
    },
    streakText: {
        fontSize: 13,
        fontWeight: '700',
    },

    // ─── Progress Dots ──────────────────
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        gap: 6,
    },
    dotWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotCurrent: {
        width: 10,
        height: 10,
        borderRadius: 5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },
    progressText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 8,
    },

    // ─── FlatList ───────────────────────
    flatList: {
        flex: 1,
    },

    // ─── Page Container ─────────────────
    pageContainer: {
        flex: 1,
    },
    pageScroll: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 40,
    },

    // ─── Question Header ────────────────
    questionHeader: {
        marginBottom: 16,
    },
    qNumberContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 10,
    },
    qNumberLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
    },
    qNumber: {
        fontSize: 28,
        fontWeight: '900',
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // ─── Glassmorphism Card ─────────────
    glassCard: {
        borderWidth: 1,
        borderRadius: 24,
        padding: 0,
        marginBottom: 24,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    cardAccentBar: {
        height: 4,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    questionText: {
        fontSize: 19,
        fontWeight: '600',
        lineHeight: 30,
        padding: 24,
        paddingTop: 20,
    },

    // ─── Options ────────────────────────
    optionsContainer: {
        marginBottom: 8,
    },

    // ─── Heart Lives ────────────────────
    livesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
    },
    heartsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    heartWrapper: {
        // Individual heart
    },
    livesText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // ─── Hint ───────────────────────────
    hintButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 6,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 20,
        marginBottom: 14,
    },
    hintButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    hintCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 14,
    },
    hintIconContainer: {
        marginTop: 2,
    },
    hintTextContainer: {
        flex: 1,
    },
    hintLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    hintText: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },

    // ─── Ad Button ──────────────────────
    adButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 24,
        marginBottom: 14,
        alignSelf: 'center',
    },
    adButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // ─── Solution ───────────────────────
    solutionCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
    },
    solutionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    solutionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    solutionText: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8,
    },
    explanationText: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 22,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 12,
        alignSelf: 'center',
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // ─── Feedback Toast ─────────────────
    feedbackOverlay: {
        position: 'absolute',
        top: 110,
        left: 24,
        right: 24,
        alignItems: 'center',
        zIndex: 999,
    },
    feedbackCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    },
    feedbackTextContainer: {
        flex: 1,
    },
    feedbackText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    feedbackPoints: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },

    // ─── Modal ──────────────────────────
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    modalContainer: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modalIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#4285F4',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 24,
        marginBottom: 16,
        elevation: 4,
    },
    googleButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    laterText: {
        fontSize: 14,
        fontWeight: '500',
        paddingVertical: 8,
    },
});
