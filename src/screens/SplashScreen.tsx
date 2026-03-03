// SplashScreen — Animated AI-themed branding intro

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { APP_NAME, APP_TAGLINE, SPLASH_DURATION } from '../utils/constants';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
    const { t } = useTranslation();
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslate = useRef(new Animated.Value(30)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0.2)).current;
    const ringRotation = useRef(new Animated.Value(0)).current;
    const particleAnims = useRef(
        Array.from({ length: 8 }, () => ({
            opacity: new Animated.Value(0),
            translateX: new Animated.Value(0),
            translateY: new Animated.Value(0),
        })),
    ).current;

    useEffect(() => {
        // Logo entrance
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Title entrance (delayed)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(titleOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(titleTranslate, {
                    toValue: 0,
                    tension: 60,
                    friction: 10,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 400);

        // Tagline entrance
        setTimeout(() => {
            Animated.timing(taglineOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }, 800);

        // Glow pulsing
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.8,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.2,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        // Ring rotation
        Animated.loop(
            Animated.timing(ringRotation, {
                toValue: 1,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();

        // Particle animations
        particleAnims.forEach((p, i) => {
            const angle = (i / 8) * 2 * Math.PI;
            const radius = 120;
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(p.opacity, {
                        toValue: 0.6,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(p.translateX, {
                        toValue: Math.cos(angle) * radius,
                        duration: 1200,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(p.translateY, {
                        toValue: Math.sin(angle) * radius,
                        duration: 1200,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]).start();
            }, 300 + i * 100);
        });

        // Navigate after splash duration
        const timer = setTimeout(() => {
            navigation.replace('Home');
        }, SPLASH_DURATION);

        return () => clearTimeout(timer);
    }, [navigation, logoScale, logoOpacity, titleOpacity, titleTranslate, taglineOpacity, glowAnim, ringRotation, particleAnims]);

    const rotate = ringRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const mathSymbols = ['∑', 'π', '∫', '√', 'Δ', '∞', 'φ', 'λ'];

    return (
        <LinearGradient
            colors={['#0A0E1A', '#121830', '#1A1040']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            {/* Floating math symbol particles */}
            {particleAnims.map((p, i) => (
                <Animated.Text
                    key={i}
                    style={[
                        styles.particle,
                        {
                            opacity: p.opacity,
                            transform: [
                                { translateX: p.translateX },
                                { translateY: p.translateY },
                            ],
                        },
                    ]}>
                    {mathSymbols[i]}
                </Animated.Text>
            ))}

            {/* Rotating ring */}
            <Animated.View
                style={[
                    styles.outerRing,
                    {
                        transform: [{ rotate }],
                        opacity: glowAnim,
                    },
                ]}
            />

            {/* Logo */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        transform: [{ scale: logoScale }],
                        opacity: logoOpacity,
                    },
                ]}>
                <View style={styles.logoInner}>
                    <Icon name="psychology" size={64} color="#6C63FF" />
                </View>
            </Animated.View>

            {/* Title */}
            <Animated.Text
                style={[
                    styles.title,
                    {
                        opacity: titleOpacity,
                        transform: [{ translateY: titleTranslate }],
                    },
                ]}>
                {APP_NAME}
            </Animated.Text>

            {/* Tagline */}
            <Animated.Text
                style={[
                    styles.tagline,
                    { opacity: taglineOpacity },
                ]}>
                {t('common.tagline') || APP_TAGLINE}
            </Animated.Text>

            {/* Bottom loading bar */}
            <View style={styles.bottomLoader}>
                <Animated.View
                    style={[
                        styles.loaderBar,
                        {
                            opacity: glowAnim,
                        },
                    ]}
                />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    particle: {
        position: 'absolute',
        fontSize: 24,
        color: 'rgba(108, 99, 255, 0.4)',
        fontWeight: '300',
    },
    outerRing: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(108, 99, 255, 0.3)',
        borderStyle: 'dashed',
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoInner: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(108, 99, 255, 0.12)',
        borderWidth: 2,
        borderColor: 'rgba(108, 99, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        fontWeight: '400',
        color: '#8B93B0',
        letterSpacing: 1,
    },
    bottomLoader: {
        position: 'absolute',
        bottom: 80,
        width: 120,
        height: 3,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loaderBar: {
        width: '100%',
        height: '100%',
        backgroundColor: '#6C63FF',
        borderRadius: 2,
    },
});
