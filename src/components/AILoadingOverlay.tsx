// AI Loading Overlay — "AI is generating your next challenge..."

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

interface Props {
    visible: boolean;
}

export default function AILoadingOverlay({ visible }: Props) {
    const { colors } = useTheme();
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const dotAnim1 = useRef(new Animated.Value(0)).current;
    const dotAnim2 = useRef(new Animated.Value(0)).current;
    const dotAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Spin animation
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ).start();

            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ).start();

            // Dot animations (staggered)
            const animateDot = (anim: Animated.Value, delay: number) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]),
                ).start();
            };

            animateDot(dotAnim1, 0);
            animateDot(dotAnim2, 200);
            animateDot(dotAnim3, 400);
        }

        return () => {
            spinAnim.setValue(0);
            pulseAnim.setValue(1);
            dotAnim1.setValue(0);
            dotAnim2.setValue(0);
            dotAnim3.setValue(0);
        };
    }, [visible, spinAnim, pulseAnim, dotAnim1, dotAnim2, dotAnim3]);

    if (!visible) return null;

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.container, { backgroundColor: colors.surface }]}>
                {/* Glowing ring */}
                <View style={[styles.glowRing, { borderColor: colors.primary, shadowColor: colors.primary }]}>
                    <Animated.View style={{ transform: [{ rotate: spin }, { scale: pulseAnim }] }}>
                        <Icon name="psychology" size={48} color={colors.primary} />
                    </Animated.View>
                </View>

                {/* Text with dots */}
                <Text style={[styles.title, { color: colors.text }]}>AI is thinking</Text>
                <View style={styles.dotsContainer}>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Generating your next challenge
                    </Text>
                    <View style={styles.dots}>
                        {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
                            <Animated.Text
                                key={i}
                                style={[
                                    styles.dot,
                                    {
                                        color: colors.primary,
                                        opacity: anim,
                                        transform: [
                                            {
                                                translateY: anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0, -4],
                                                }),
                                            },
                                        ],
                                    },
                                ]}>
                                •
                            </Animated.Text>
                        ))}
                    </View>
                </View>

                {/* Neural network particles */}
                <View style={styles.particlesRow}>
                    {['∑', 'π', '∫', '√', 'Δ', '∞'].map((symbol, i) => (
                        <Animated.Text
                            key={i}
                            style={[
                                styles.particle,
                                {
                                    color: colors.primaryGlow,
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [1, 1.2],
                                        outputRange: [0.3, 0.7],
                                    }),
                                },
                            ]}>
                            {symbol}
                        </Animated.Text>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        borderRadius: 24,
        paddingVertical: 40,
        paddingHorizontal: 48,
        alignItems: 'center',
        elevation: 20,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    glowRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
    },
    dots: {
        flexDirection: 'row',
        marginLeft: 4,
    },
    dot: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 1,
    },
    particlesRow: {
        flexDirection: 'row',
        marginTop: 24,
        gap: 16,
    },
    particle: {
        fontSize: 20,
        fontWeight: '300',
    },
});
