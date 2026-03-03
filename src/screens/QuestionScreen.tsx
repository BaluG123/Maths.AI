// QuestionScreen — Core quiz flow with all game logic
// Features: paging, 2-trial system, reward ad, AI loading, sign-in gate, sound effects

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import AILoadingOverlay from '../components/AILoadingOverlay';
import ProfileAvatar from '../components/ProfileAvatar';
import OptionButton from '../components/OptionButton';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import {
    FREE_QUESTION_LIMIT,
    MAX_TRIALS_PER_QUESTION,
    AI_LOADING_DELAY,
    CORRECT_ANSWER_DELAY,
    CORRECT_ANSWER_POINTS,
    WRONG_ANSWER_PENALTY,
    STREAK_BONUS_MULTIPLIER,
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
import { showRewardAd, loadRewardAd } from '../services/adService';
import questionsData from '../data/questions.json';

const { width, height } = Dimensions.get('window');

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

export default function QuestionScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user, isSignedIn, signInWithGoogle } = useAuth();
    const { playCorrectSound, playWrongSound } = useSound();
    const flatListRef = useRef<FlatList>(null);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [trials, setTrials] = useState<{ [key: string]: number }>({});
    const [optionStates, setOptionStates] = useState<{ [key: string]: OptionState[] }>({});
    const [showHint, setShowHint] = useState<{ [key: string]: boolean }>({});
    const [showSolution, setShowSolution] = useState<{ [key: string]: boolean }>({});
    const [answered, setAnswered] = useState<{ [key: string]: boolean }>({});
    const [showAILoading, setShowAILoading] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [levelNumber, setLevelNumber] = useState(1);

    // Animations
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        initQuestions();
        loadRewardAd().catch(() => { });

        Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [headerOpacity]);

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

    const handleOptionPress = useCallback(
        (questionId: string, optionIndex: number, correctIndex: number) => {
            if (answered[questionId]) return;

            const currentTrials = (trials[questionId] || 0) + 1;
            const isCorrect = optionIndex === correctIndex;

            // Update option states
            const states = [...(optionStates[questionId] || ['default', 'default', 'default', 'default'])];
            if (isCorrect) {
                states[optionIndex] = 'correct';
            } else {
                states[optionIndex] = 'wrong';
            }

            setOptionStates(prev => ({ ...prev, [questionId]: states }));
            setTrials(prev => ({ ...prev, [questionId]: currentTrials }));

            if (isCorrect) {
                // Correct answer!
                playCorrectSound();
                setAnswered(prev => ({ ...prev, [questionId]: true }));

                // Calculate score
                const streakBonus = streak > 0 ? streak * STREAK_BONUS_MULTIPLIER : 0;
                const newScore = score + CORRECT_ANSWER_POINTS + streakBonus;
                const newStreak = streak + 1;
                setScore(newScore);
                setStreak(newStreak);
                setUserScore(newScore);
                setUserStreak(newStreak);
                markQuestionCompleted(questionId);

                // Sync with Firestore if signed in
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

                // Auto-scroll to next question after delay
                setTimeout(() => {
                    moveToNextQuestion();
                }, CORRECT_ANSWER_DELAY);
            } else {
                // Wrong answer
                playWrongSound();
                setStreak(0);
                setUserStreak(0);

                // Apply penalty
                const newScore = Math.max(0, score - WRONG_ANSWER_PENALTY);
                setScore(newScore);
                setUserScore(newScore);

                if (currentTrials >= MAX_TRIALS_PER_QUESTION) {
                    // Max trials reached — offer ad to see solution
                    setAnswered(prev => ({ ...prev, [questionId]: true }));
                }
            }
        },
        [answered, trials, optionStates, score, streak, levelNumber, isSignedIn, user, playCorrectSound, playWrongSound],
    );

    const moveToNextQuestion = () => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= questions.length) {
            Alert.alert('🎉 Congratulations!', 'You have completed all available questions!', [
                { text: 'Go Home', onPress: () => navigation.goBack() },
            ]);
            return;
        }

        const nextLevel = levelNumber + 1;
        setLevelNumber(nextLevel);

        // Check sign-in gate at level 6
        if (nextLevel > FREE_QUESTION_LIMIT && !isSignedIn) {
            setShowSignInModal(true);
            return;
        }

        // Show AI loading animation
        setShowAILoading(true);
        setTimeout(() => {
            setShowAILoading(false);
            setCurrentIndex(nextIndex);
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        }, AI_LOADING_DELAY);
    };

    const handleWatchAd = async (questionId: string) => {
        try {
            const rewarded = await showRewardAd();
            if (rewarded) {
                setShowSolution(prev => ({ ...prev, [questionId]: true }));
            }
        } catch {
            // Graceful fallback — show solution anyway
            setShowSolution(prev => ({ ...prev, [questionId]: true }));
        }
    };

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
            setShowSignInModal(false);
            // Continue to next question
            moveToNextQuestion();
        } catch (error) {
            Alert.alert('Sign In Failed', 'Please try again');
        }
    };

    const renderQuestion = ({ item, index }: { item: Question; index: number }) => {
        const questionTrials = trials[item.id] || 0;
        const questionAnswered = answered[item.id] || false;
        const questionOptionStates = optionStates[item.id] || ['default', 'default', 'default', 'default'];
        const hintVisible = showHint[item.id] || false;
        const solutionVisible = showSolution[item.id] || false;
        const triedMaxAndFailed = questionTrials >= MAX_TRIALS_PER_QUESTION && !questionOptionStates.includes('correct');

        return (
            <View style={[styles.questionPage, { width }]}>
                <View style={styles.questionContent}>
                    {/* Category + Difficulty badges */}
                    <View style={styles.badges}>
                        <View style={[styles.badge, { backgroundColor: colors.primaryGlow }]}>
                            <Text style={[styles.badgeText, { color: colors.primary }]}>{item.category}</Text>
                        </View>
                        <View
                            style={[
                                styles.badge,
                                {
                                    backgroundColor:
                                        item.difficulty === 'hard'
                                            ? colors.wrongBg
                                            : item.difficulty === 'medium'
                                                ? 'rgba(255, 193, 7, 0.15)'
                                                : colors.correctBg,
                                },
                            ]}>
                            <Text
                                style={[
                                    styles.badgeText,
                                    {
                                        color:
                                            item.difficulty === 'hard'
                                                ? colors.wrong
                                                : item.difficulty === 'medium'
                                                    ? '#FFC107'
                                                    : colors.correct,
                                    },
                                ]}>
                                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                            </Text>
                        </View>
                    </View>

                    {/* Question text */}
                    <View style={[styles.questionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <Text style={[styles.questionText, { color: colors.text }]}>{item.question}</Text>
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {item.options.map((option, optIdx) => (
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

                    {/* Trial indicator */}
                    <View style={styles.trialRow}>
                        <View style={styles.trialDots}>
                            {Array.from({ length: MAX_TRIALS_PER_QUESTION }).map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.trialDot,
                                        {
                                            backgroundColor: i < questionTrials ? colors.wrong : colors.border,
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                        <Text style={[styles.trialText, { color: colors.textMuted }]}>
                            {questionTrials}/{MAX_TRIALS_PER_QUESTION} attempts
                        </Text>
                    </View>

                    {/* Hint button */}
                    {!hintVisible && (
                        <TouchableOpacity
                            onPress={() => setShowHint(prev => ({ ...prev, [item.id]: true }))}
                            style={[styles.hintButton, { borderColor: colors.secondary }]}>
                            <Icon name="lightbulb-outline" size={18} color={colors.secondary} />
                            <Text style={[styles.hintButtonText, { color: colors.secondary }]}>Show Hint</Text>
                        </TouchableOpacity>
                    )}

                    {/* Hint text */}
                    {hintVisible && (
                        <View style={[styles.hintCard, { backgroundColor: colors.secondaryGlow, borderColor: colors.secondary }]}>
                            <Icon name="lightbulb" size={20} color={colors.secondary} />
                            <Text style={[styles.hintText, { color: colors.text }]}>{item.hint}</Text>
                        </View>
                    )}

                    {/* Watch Ad button (after max trials and wrong) */}
                    {triedMaxAndFailed && !solutionVisible && (
                        <TouchableOpacity
                            onPress={() => handleWatchAd(item.id)}
                            style={[styles.adButton, { backgroundColor: colors.accent }]}>
                            <Icon name="play-circle-outline" size={22} color="#FFFFFF" />
                            <Text style={styles.adButtonText}>Watch Ad to See Solution</Text>
                        </TouchableOpacity>
                    )}

                    {/* Solution & Explanation (after ad or correct answer) */}
                    {(solutionVisible || questionOptionStates.includes('correct')) && (
                        <View style={[styles.solutionCard, { backgroundColor: colors.correctBg, borderColor: colors.correct }]}>
                            <View style={styles.solutionHeader}>
                                <Icon name="verified" size={20} color={colors.correct} />
                                <Text style={[styles.solutionTitle, { color: colors.correct }]}>Solution</Text>
                            </View>
                            <Text style={[styles.solutionText, { color: colors.text }]}>Answer: {item.solution}</Text>
                            <Text style={[styles.explanationText, { color: colors.textSecondary }]}>{item.explanation}</Text>

                            {/* Next question button (if solution was revealed via ad) */}
                            {triedMaxAndFailed && solutionVisible && (
                                <TouchableOpacity
                                    onPress={moveToNextQuestion}
                                    style={[styles.nextButton, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.nextButtonText}>Next Question</Text>
                                    <Icon name="arrow-forward" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <GradientBackground>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
                {/* Back button */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back-ios" size={20} color={colors.text} />
                </TouchableOpacity>

                {/* Level indicator */}
                <View style={styles.levelContainer}>
                    <Text style={[styles.levelText, { color: colors.textSecondary }]}>Level</Text>
                    <Text style={[styles.levelNumber, { color: colors.primary }]}>{levelNumber}</Text>
                </View>

                {/* Score */}
                <View style={styles.scoreContainer}>
                    <Icon name="star" size={16} color={colors.secondary} />
                    <Text style={[styles.scoreText, { color: colors.text }]}>{score}</Text>
                </View>

                {/* Streak */}
                {streak > 0 && (
                    <View style={[styles.streakBadge, { backgroundColor: colors.wrongBg }]}>
                        <Text style={styles.streakText}>🔥 {streak}</Text>
                    </View>
                )}

                {/* Profile Avatar */}
                <ProfileAvatar onPress={() => navigation.navigate('Settings')} size={36} />
            </Animated.View>

            {/* Progress bar */}
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <Animated.View
                    style={[
                        styles.progressBarFill,
                        {
                            backgroundColor: colors.primary,
                            width: questions.length > 0 ? `${((currentIndex + 1) / questions.length) * 100}%` : '0%',
                        },
                    ]}
                />
            </View>

            {/* Questions FlatList */}
            <FlatList
                ref={flatListRef}
                data={questions}
                renderItem={renderQuestion}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />

            {/* AI Loading */}
            <AILoadingOverlay visible={showAILoading} />

            {/* Sign-In Modal */}
            <Modal visible={showSignInModal} transparent animationType="fade">
                <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                        <View style={[styles.modalIconWrapper, { backgroundColor: colors.primaryGlow }]}>
                            <Icon name="lock-open" size={40} color={colors.primary} />
                        </View>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Unlock Unlimited Questions
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            You've completed the free trial! Sign in with Google to continue your math journey and compete on the leaderboard.
                        </Text>
                        <TouchableOpacity onPress={handleSignIn} style={styles.googleButton}>
                            <Icon name="login" size={22} color="#FFFFFF" />
                            <Text style={styles.googleButtonText}>Sign in with Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setShowSignInModal(false); navigation.goBack(); }}>
                            <Text style={[styles.laterText, { color: colors.textMuted }]}>Maybe later</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        gap: 12,
    },
    backButton: {
        padding: 8,
    },
    levelContainer: {
        alignItems: 'center',
    },
    levelText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    levelNumber: {
        fontSize: 20,
        fontWeight: '800',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 'auto',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: '700',
    },
    streakBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    streakText: {
        fontSize: 12,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 3,
        marginHorizontal: 16,
        borderRadius: 2,
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    questionPage: {
        height: height - 120,
        paddingHorizontal: 20,
    },
    questionContent: {
        flex: 1,
        paddingTop: 8,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    questionCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 28,
    },
    optionsContainer: {
        marginBottom: 16,
    },
    trialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    trialDots: {
        flexDirection: 'row',
        gap: 6,
    },
    trialDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    trialText: {
        fontSize: 12,
        fontWeight: '500',
    },
    hintButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 20,
        marginBottom: 12,
    },
    hintButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    hintCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    hintText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },
    adButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 24,
        marginBottom: 12,
        alignSelf: 'center',
    },
    adButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    solutionCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
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
    // Sign-In Modal
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
