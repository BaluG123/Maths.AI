// App Navigator — Stack navigation: Splash → Home → Question → Settings

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import QuestionScreen from '../screens/QuestionScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: 'transparent' },
            }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
                name="Question"
                component={QuestionScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ animation: 'slide_from_right' }}
            />
        </Stack.Navigator>
    );
}
