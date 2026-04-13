import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import * as authService from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { setAuth, updateUser, user, isAuthenticated, logout } = useAuthStore();

    const handleLogin = useCallback(async (email?: string, password?: string) => {
        setIsLoading(true);
        try {
            const { user, accessToken } = await authService.login(email!, password!);
            setAuth(user, accessToken);
            return true;
        } catch (error: any) {
            Alert.alert('Lỗi', 'Đăng nhập thất bại: ' + error.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [setAuth]);

    const handleRegister = useCallback(async (payload: any) => {
        setIsLoading(true);
        try {
            const { user, accessToken } = await authService.register(payload);
            setAuth(user, accessToken);
            return true;
        } catch (error: any) {
            Alert.alert('Lỗi', 'Đăng ký thất bại: ' + error.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [setAuth]);

    const handleChangePassword = useCallback(async (currentPassword?: string, newPassword?: string, confirmPassword?: string) => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return false;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return false;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return false;
        }

        setIsLoading(true);
        try {
            await authService.changePassword(currentPassword!, newPassword!);
            Alert.alert('Thành công', 'Đổi mật khẩu thành công');
            return true;
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleUpdateProfile = useCallback(async (firstName?: string, lastName?: string) => {
        if (!firstName?.trim() || !lastName?.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return false;
        }

        setIsLoading(true);
        try {
            const data = await authService.updateProfile(firstName!, lastName!);
            if (data?.user) {
                updateUser(data.user);
                Alert.alert('Thành công', 'Cập nhật thông tin thành công');
            }
            return true;
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [updateUser]);

    const handleForgotPassword = useCallback(async (email: string) => {
        setIsLoading(true);
        try {
            await authService.forgotPassword(email);
            return true;
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- Output ---
    const state = useMemo(() => ({
        isLoading,
        user,
        isAuthenticated
    }), [isLoading, user, isAuthenticated]);

    const actions = useMemo(() => ({
        handleLogin,
        handleRegister,
        handleChangePassword,
        handleUpdateProfile,
        handleForgotPassword,
        logout
    }), [handleLogin, handleRegister, handleChangePassword, handleUpdateProfile, handleForgotPassword, logout]);

    return { state, actions };
};
