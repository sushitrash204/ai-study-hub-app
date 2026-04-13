import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';

import { useAuthStore } from '../store/authStore';

// Flag to prevent multiple simultaneous logout calls
let isLoggingOut = false;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'x-client-platform': 'mobile'
    }
});

api.interceptors.request.use(
    (config) => {
        // Use synchronous access to avoid race conditions with axios
        const { accessToken } = useAuthStore.getState();

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`[API Debug] Token from store: ${accessToken ? 'YES (' + accessToken.substring(0, 15) + '...)' : 'NO'}`);

        if (accessToken) {
            const authHeader = `Bearer ${accessToken}`;
            config.headers.Authorization = authHeader;
            console.log(`[API Debug] Set Authorization header: ${authHeader.substring(0, 25)}...`);
        } else {
            console.warn(`[API Warning] No token found in store for ${config.url}`);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const data = error.response?.data;

        console.log(`[API Response Error] ${status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);
        console.log(`[API Response Error] Data:`, JSON.stringify(data));

        // Don't trigger logout loop if the failing request is an auth request
        if (
            status === 401 &&
            originalRequest &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/logout') &&
            !originalRequest.url?.includes('/auth/register') &&
            !isLoggingOut // Prevent multiple simultaneous logout calls
        ) {
            isLoggingOut = true;
            try {
                const errorMsg = data?.message || data?.error || 'Unknown';
                console.log(`[API Error] 401 Unauthorized. Reason: ${errorMsg}`);
                console.log(`[API Error] Failing URL: ${originalRequest.url}`);
                console.log(`[API Error] Headers:`, JSON.stringify(originalRequest.headers));

                const { logout } = useAuthStore.getState();
                await logout();
            } finally {
                isLoggingOut = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
