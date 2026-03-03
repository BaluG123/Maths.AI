// Profile Avatar — Top-right corner profile image

import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface Props {
    onPress: () => void;
    size?: number;
}

export default function ProfileAvatar({ onPress, size = 40 }: Props) {
    const { colors } = useTheme();
    const { user, isSignedIn } = useAuth();

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: colors.primary,
                    backgroundColor: colors.surfaceElevated,
                },
            ]}
            activeOpacity={0.7}>
            {isSignedIn && user?.photoURL ? (
                <Image
                    source={{ uri: user.photoURL }}
                    style={[styles.image, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}
                />
            ) : (
                <Icon name="person" size={size * 0.6} color={colors.textSecondary} />
            )}
            {/* Online indicator dot */}
            {isSignedIn && (
                <View
                    style={[
                        styles.onlineDot,
                        {
                            backgroundColor: colors.correct,
                            borderColor: colors.surface,
                        },
                    ]}
                />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        resizeMode: 'cover',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
    },
});
