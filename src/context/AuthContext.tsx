// Auth Context — Google Sign-In with Firebase Auth

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import NotificationService from '../services/NotificationService';

interface AuthContextType {
    user: FirebaseAuthTypes.User | null;
    isSignedIn: boolean;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isSignedIn: false,
    isLoading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Configure Google Sign-In
        GoogleSignin.configure({
            webClientId: '645495318161-1jmgfggpo4sqr18e7fbvcq8egfa8q5dc.apps.googleusercontent.com',
        });

        // Check for existing Google session
        const checkUser = async () => {
            try {
                const currentUser = await GoogleSignin.getCurrentUser();
                if (!currentUser) {
                    await GoogleSignin.signInSilently();
                }
            } catch (e) {
                // Not signed in silently
            }
        };
        checkUser();

        // Listen for auth state changes
        const unsubscribe = auth().onAuthStateChanged(firebaseUser => {
            const isNewLogin = !user && firebaseUser;
            setUser(firebaseUser);
            setIsLoading(false);

            if (isNewLogin && firebaseUser.displayName) {
                NotificationService.sendWelcomeNotification(firebaseUser.displayName);
                NotificationService.scheduleDailyReminder(firebaseUser.displayName);
            }
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            // Check if device supports Google Play
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Sign in with Google
            const response = await GoogleSignin.signIn();
            const idToken = response?.data?.idToken;

            if (!idToken) {
                throw new Error('No ID token found');
            }

            // Create a Google credential with the token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // Sign-in the user with the credential
            await auth().signInWithCredential(googleCredential);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await auth().signOut();
            // GoogleSignin.signOut() can fail if not signed in or not initialized correctly
            const currentUser = await GoogleSignin.getCurrentUser();
            if (currentUser) {
                await GoogleSignin.signOut();
            }
        } catch (error) {
            console.error('Sign-Out Error:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isSignedIn: !!user,
                isLoading,
                signInWithGoogle,
                signOut,
            }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
