// Gradient Background Component — Reusable gradient wrapper

import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface Props {
    children: ReactNode;
    style?: any;
}

function GradientBackground({ children, style }: Props) {
    const { colors } = useTheme();

    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
            style={[styles.container, style]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            {children}
        </LinearGradient>
    );
}

export default React.memo(GradientBackground);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
