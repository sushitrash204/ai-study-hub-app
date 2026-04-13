import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { User } from '../models/User';
import { useAuthStore } from '../store/authStore';

interface AuthContextData {
    user: User | null;
    isLoading: boolean;
    login: (userData: User, accessToken: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updatedData: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in when app starts
        const checkLoginStatus = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                const storedToken = await AsyncStorage.getItem('accessToken');
                if (storedUser && storedToken) {
                    const parsedUser = new User(JSON.parse(storedUser));

                    // Sync with authStore first so api.ts is ready
                    useAuthStore.getState().setAuth(parsedUser, storedToken);

                    // Then set user to trigger navigation
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error('Error loading user from storage', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    const login = async (userData: User, accessToken: string, refreshToken: string) => {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);

        // Sync with authStore
        useAuthStore.getState().setAuth(userData, accessToken);
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');

        // Sync with authStore (clear it)
        try {
            await useAuthStore.getState().logout();
        } catch (e) {
            // Ignore - authStore logout is best effort
        }
    };

    const updateUser = async (updatedData: Partial<User>) => {
        if (!user) return;
        const newUser = new User({ ...user, ...updatedData });
        setUser(newUser);
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
