// HomeScreen — Main landing screen with branding + Start Challenge CTA

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../utils/constants';
import { getCompletedQuestions } from '../utils/storageHelper';
import { getUserScore } from '../utils/storageHelper';
import { getRankInfo } from '../utils/rankCalculator';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { isSignedIn, user } = useAuth();
    const [completedCount, setCompletedCount] = useState(0);
    const [score, setScore] = useState(0);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const buttonScale = useRef(new Animated.Value(0.8)).current;
    const buttonGlow = useRef(new Animated.Value(0.4)).current;
    const floatingAnims = useRef(
        Array.from({ length: 6 }, () => ({
            translateY: new Animated.Value(0),
            opacity: new Animated.Value(0.15),
        })),
    ).current;

    useEffect(() => {
        loadStats();

        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
            Animated.spring(buttonScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true, delay: 300 }),
        ]).start();

        // Button glow
        Animated.loop(
            Animated.sequence([
                Animated.timing(buttonGlow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(buttonGlow, { toValue: 0.4, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
        ).start();

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
    }, [fadeAnim, slideAnim, buttonScale, buttonGlow, floatingAnims]);

    const loadStats = async () => {
        const completed = await getCompletedQuestions();
        setCompletedCount(completed.length);
        const s = await getUserScore();
        setScore(s);
    };

    // Reload stats when screen focuses
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadStats);
        return unsubscribe;
    }, [navigation]);

    const rankInfo = getRankInfo(score);
    const mathSymbols = ['∑', 'π', '∫', '√', 'Δ', '∞'];
    const symbolPositions = [
        { top: '15%', left: '10%' },
        { top: '20%', right: '15%' },
        { top: '45%', left: '5%' },
        { top: '50%', right: '8%' },
        { top: '70%', left: '12%' },
        { top: '75%', right: '10%' },
    ];

    return (
        <GradientBackground>
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
                {/* Brain Logo */}
                <View style={[styles.logoWrapper, { shadowColor: colors.primary }]}>
                    <View style={[styles.logoBg, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}>
                        <Icon name="psychology" size={56} color={colors.primary} />
                    </View>
                </View>

                {/* App Name */}
                <Text style={[styles.appName, { color: colors.text }]}>{APP_NAME}</Text>
                <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
                    Challenge your mind. Elevate your thinking.
                </Text>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <Icon name="check-circle" size={24} color={colors.correct} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{completedCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Solved</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <Icon name="star" size={24} color={colors.secondary} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{score}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Score</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <Icon name={rankInfo.icon} size={24} color={rankInfo.color} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{rankInfo.title}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rank</Text>
                    </View>
                </View>

                {/* Start Button */}
                <Animated.View
                    style={{
                        transform: [{ scale: buttonScale }],
                        opacity: buttonGlow.interpolate({
                            inputRange: [0.4, 1],
                            outputRange: [0.9, 1],
                        }),
                    }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Question')}
                        activeOpacity={0.85}
                        style={[styles.startButton, { shadowColor: colors.primary }]}>
                        <Icon name="play-arrow" size={28} color="#FFFFFF" style={styles.playIcon} />
                        <Text style={styles.startButtonText}>Start Challenge</Text>
                        <Icon name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </Animated.View>

                {/* Sign-in prompt */}
                {!isSignedIn && (
                    <View style={styles.signInHint}>
                        <Icon name="info-outline" size={16} color={colors.textMuted} />
                        <Text style={[styles.signInText, { color: colors.textMuted }]}>
                            First 5 questions are free. Sign in for unlimited access.
                        </Text>
                    </View>
                )}

                {/* Signed in greeting */}
                {isSignedIn && user && (
                    <View style={styles.greeting}>
                        <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
                            Welcome back, {user.displayName?.split(' ')[0]}! 🧠
                        </Text>
                    </View>
                )}
            </Animated.View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    floatingSymbol: {
        position: 'absolute',
        fontSize: 36,
        fontWeight: '200',
        zIndex: -1,
    },
    logoWrapper: {
        marginBottom: 24,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 20,
    },
    logoBg: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: 44,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 8,
    },
    appSubtitle: {
        fontSize: 15,
        fontWeight: '400',
        letterSpacing: 0.5,
        marginBottom: 40,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 40,
    },
    statCard: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1,
        minWidth: (width - 100) / 3,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 6,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C63FF',
        paddingVertical: 18,
        paddingHorizontal: 36,
        borderRadius: 28,
        gap: 12,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
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
    signInHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        gap: 8,
        paddingHorizontal: 20,
    },
    signInText: {
        fontSize: 12,
        fontWeight: '400',
    },
    greeting: {
        marginTop: 24,
    },
    greetingText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
