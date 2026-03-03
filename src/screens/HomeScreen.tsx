// HomeScreen — Main landing screen with branding + Start Challenge CTA + Leaderboard

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    ScrollView,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { APP_NAME } from '../utils/constants';
import { getCompletedQuestions } from '../utils/storageHelper';
import { getUserScore } from '../utils/storageHelper';
import { getRankInfo } from '../utils/rankCalculator';
import { getLeaderboard, UserRanking } from '../services/firebaseService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { isSignedIn, user } = useAuth();
    const [completedCount, setCompletedCount] = useState(0);
    const [score, setScore] = useState(0);
    const [leaderboard, setLeaderboard] = useState<UserRanking[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const buttonScale = useRef(new Animated.Value(0.8)).current;
    const boardFade = useRef(new Animated.Value(0)).current;
    const floatingAnims = useRef(
        Array.from({ length: 6 }, () => ({
            translateY: new Animated.Value(0),
            opacity: new Animated.Value(0.15),
        })),
    ).current;

    useEffect(() => {
        loadStats();
        loadLeaderboard();

        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
            Animated.spring(buttonScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true, delay: 300 }),
        ]).start();

        // Floating symbols
        floatingAnims.forEach((anim, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim.translateY, { toValue: -20 - i * 3, duration: 2000 + i * 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(anim.translateY, { toValue: 0, duration: 2000 + i * 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
            ).start();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim.opacity, { toValue: 0.35, duration: 1500 + i * 200, useNativeDriver: true }),
                    Animated.timing(anim.opacity, { toValue: 0.1, duration: 1500 + i * 200, useNativeDriver: true }),
                ]),
            ).start();
        });
    }, [fadeAnim, slideAnim, buttonScale, floatingAnims]);

    const loadStats = async () => {
        const completed = await getCompletedQuestions();
        setCompletedCount(completed.length);
        const s = await getUserScore();
        setScore(s);
    };

    const loadLeaderboard = async () => {
        setLoadingLeaderboard(true);
        const top10 = await getLeaderboard(10);
        setLeaderboard(top10);
        setLoadingLeaderboard(false);
        Animated.timing(boardFade, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    };

    // Reload stats when screen focuses
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadStats();
            loadLeaderboard();
        });
        return unsubscribe;
    }, [navigation]);

    const rankInfo = getRankInfo(score);
    const mathSymbols = ['∑', 'π', '∫', '√', 'Δ', '∞'];
    const symbolPositions = [
        { top: '10%', left: '10%' },
        { top: '15%', right: '15%' },
        { top: '35%', left: '5%' },
        { top: '40%', right: '8%' },
        { top: '60%', left: '12%' },
        { top: '65%', right: '10%' },
    ];

    const renderLeaderboardItem = (item: UserRanking, index: number) => {
        const isMe = item.userId === user?.uid;
        return (
            <View key={item.userId} style={[styles.boardItem, { borderBottomColor: colors.border }]}>
                <View style={styles.boardLeft}>
                    <Text style={[styles.boardRank, { color: colors.textSecondary }]}>{index + 1}</Text>
                    {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={styles.boardAvatar} />
                    ) : (
                        <View style={[styles.boardAvatarPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
                            <Icon name="person" size={20} color={colors.textMuted} />
                        </View>
                    )}
                    <Text style={[styles.boardName, { color: colors.text, fontWeight: isMe ? '700' : '400' }]} numberOfLines={1}>
                        {isMe ? 'You' : item.displayName || t('settings.guest')}
                    </Text>
                </View>
                <View style={styles.boardRight}>
                    <Text style={[styles.boardScore, { color: colors.primary }]}>{item.score}</Text>
                </View>
            </View>
        );
    };

    const renderTop3 = () => {
        if (leaderboard.length === 0) return null;
        const top3 = leaderboard.slice(0, 3);
        const order = [1, 0, 2]; // Silver, Gold, Bronze
        const config = [
            { label: '2nd', color: '#C0C0C0', size: 70, icon: 'emoji-events' },
            { label: '1st', color: '#FFD700', size: 90, icon: 'emoji-events' },
            { label: '3rd', color: '#CD7F32', size: 70, icon: 'emoji-events' },
        ];

        return (
            <View style={styles.top3Row}>
                {order.map((idx) => {
                    const player = top3[idx];
                    if (!player) return <View key={idx} style={{ flex: 1 }} />;
                    const conf = config[idx];
                    return (
                        <View key={player.userId} style={styles.top3Podium}>
                            <View style={[styles.top3AvatarContainer, { borderColor: conf.color, width: conf.size, height: conf.size }]}>
                                {player.photoURL ? (
                                    <Image source={{ uri: player.photoURL }} style={[styles.top3Avatar, { width: conf.size - 6, height: conf.size - 6 }]} />
                                ) : (
                                    <View style={[styles.top3AvatarPlaceholder, { width: conf.size - 6, height: conf.size - 6 }]}>
                                        <Icon name="person" size={conf.size / 2} color={colors.textMuted} />
                                    </View>
                                )}
                                <View style={[styles.rankBadge, { backgroundColor: conf.color }]}>
                                    <Text style={styles.rankBadgeText}>{conf.label}</Text>
                                </View>
                            </View>
                            <Text style={[styles.top3Name, { color: colors.text }]} numberOfLines={1}>{player.displayName?.split(' ')[0]}</Text>
                            <Text style={[styles.top3Score, { color: colors.primary }]}>{player.score}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <GradientBackground>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Floating math symbols */}
                {mathSymbols.map((symbol, i) => (
                    <Animated.Text
                        key={i}
                        style={[
                            styles.floatingSymbol,
                            symbolPositions[i] as any,
                            {
                                color: colors.primary,
                                opacity: floatingAnims[i].opacity,
                                transform: [{ translateY: floatingAnims[i].translateY }],
                            },
                        ]}>
                        {symbol}
                    </Animated.Text>
                ))}

                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}>

                    {/* Brand Header */}
                    <View style={styles.header}>
                        <View style={[styles.logoWrapper, { shadowColor: colors.primary }]}>
                            <View style={[styles.logoBg, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}>
                                <Icon name="functions" size={48} color={colors.primary} />
                            </View>
                        </View>
                        <Text style={[styles.appName, { color: colors.text }]}>{APP_NAME}</Text>
                        <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
                            {t('common.tagline')}
                        </Text>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                            <Icon name="check-circle" size={20} color={colors.correct} />
                            <Text style={[styles.statNumber, { color: colors.text }]}>{completedCount}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('common.solved')}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                            <Icon name="star" size={20} color={colors.secondary} />
                            <Text style={[styles.statNumber, { color: colors.text }]}>{score}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('common.score')}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                            <Icon name={rankInfo.icon} size={20} color={rankInfo.color} />
                            <Text style={[styles.statNumber, { color: colors.text }]}>{rankInfo.title}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('common.rank')}</Text>
                        </View>
                    </View>

                    {/* Main CTA */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Question')}
                        activeOpacity={0.85}
                        style={[styles.startButton, { shadowColor: colors.primary, transform: [{ scale: 1 }] }]}>
                        <Icon name="play-arrow" size={28} color="#FFFFFF" style={styles.playIcon} />
                        <Text style={styles.startButtonText}>{t('common.start')}</Text>
                        <Icon name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    {/* Greeting */}
                    {isSignedIn && user && (
                        <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
                            {t('common.welcome_back')}, {user.displayName?.split(' ')[0]}! 🏆
                        </Text>
                    )}

                    {!isSignedIn && (
                        <View style={styles.signInHint}>
                            <Icon name="info-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.signInText, { color: colors.textMuted }]}>
                                {t('common.free_hint')}
                            </Text>
                        </View>
                    )}

                    {/* Leaderboard Section */}
                    <Animated.View style={[styles.leaderboardSection, { opacity: boardFade }]}>
                        <View style={styles.sectionHeader}>
                            <Icon name="emoji-events" size={24} color={colors.secondary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('common.leaderboard')}</Text>
                        </View>

                        {loadingLeaderboard ? (
                            <View style={styles.loadingContainer}>
                                <Text style={{ color: colors.textMuted }}>{t('common.loading')}</Text>
                            </View>
                        ) : leaderboard.length > 0 ? (
                            <View style={[styles.boardCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                                {renderTop3()}
                                <View style={styles.boardList}>
                                    {leaderboard.slice(3).map((item, index) => renderLeaderboardItem(item, index + 3))}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={{ color: colors.textMuted }}>No rankings available yet.</Text>
                            </View>
                        )}
                    </Animated.View>

                    <View style={{ height: 40 }} />
                </Animated.View>
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    floatingSymbol: {
        position: 'absolute',
        fontSize: 32,
        fontWeight: '200',
        zIndex: -1,
    },
    logoWrapper: {
        marginBottom: 16,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 15,
    },
    logoBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: 40,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 4,
    },
    appSubtitle: {
        fontSize: 14,
        fontWeight: '400',
        letterSpacing: 0.5,
        textAlign: 'center',
        opacity: 0.8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 32,
    },
    statCard: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        flex: 1,
    },
    statNumber: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C63FF',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        gap: 12,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        marginBottom: 20,
    },
    playIcon: {
        marginRight: -4,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    greetingText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    signInHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    signInText: {
        fontSize: 12,
    },
    leaderboardSection: {
        width: '100%',
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingLeft: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    boardCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        overflow: 'hidden',
    },
    top3Row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    top3Podium: {
        alignItems: 'center',
        flex: 1,
    },
    top3AvatarContainer: {
        borderRadius: 100,
        borderWidth: 3,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    top3Avatar: {
        borderRadius: 100,
    },
    top3AvatarPlaceholder: {
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankBadge: {
        position: 'absolute',
        bottom: -5,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#000',
    },
    rankBadgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '800',
    },
    top3Name: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
        maxWidth: 70,
    },
    top3Score: {
        fontSize: 14,
        fontWeight: '800',
    },
    boardList: {
        gap: 4,
    },
    boardItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
    },
    boardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    boardRank: {
        fontSize: 14,
        fontWeight: '600',
        width: 15,
    },
    boardAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    boardAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    boardName: {
        fontSize: 14,
        flex: 1,
    },
    boardRight: {
        alignItems: 'flex-end',
    },
    boardScore: {
        fontSize: 15,
        fontWeight: '700',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
});
