import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { User } from '../models/User';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    setAuth: (user: User, accessToken: string) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isInitializing: true,

    initialize: async () => {
        // Prevent multiple initialization calls
        if (get().isAuthenticated && !get().isInitializing) return;

        try {
            set({ isInitializing: true });
            const storedUser = await AsyncStorage.getItem('user');
            const storedToken = await AsyncStorage.getItem('accessToken');

            if (storedUser && storedToken) {
                const user = new User(JSON.parse(storedUser));
                // Set the cached user and assume authenticated
                set({ user, accessToken: storedToken, isAuthenticated: true, isInitializing: false });
            } else {
                set({ isInitializing: false });
            }
        } catch (error) {
            console.error('Error loading auth from storage', error);
            set({ isInitializing: false });
        }
    },

    setAuth: async (user, accessToken) => {
        // Set memory state FIRST (sync) so interceptors can access token immediately
        set({
            user,
            accessToken,
            isAuthenticated: true
        });
        // Then persist to disk (async, don't block navigation)
        AsyncStorage.setItem('user', JSON.stringify(user));
        AsyncStorage.setItem('accessToken', accessToken);
    },

    updateUser: async (user) => {
        set({ user });
        await AsyncStorage.setItem('user', JSON.stringify(user));
    },

    logout: async () => {
        // Clear state FIRST to prevent logout loops
        set({
            user: null,
            accessToken: null,
            isAuthenticated: false
        });
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');

        // Try to call logout API AFTER clearing state (best effort, ignore errors)
        // Use raw axios to avoid interceptor loops
        try {
            const rawApi = axios.create({
                baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api',
                headers: { 'x-client-platform': 'mobile' }
            });
            await rawApi.post('/auth/logout');
        } catch (err) {
            // Silently ignore - user is already logged out locally
        }
    }
}));
