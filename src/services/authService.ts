import api from './api';
import { User } from '../models/User';
import { AuthSessionResponse, UpdateProfileResponse, ChangePasswordResponse, RegisterPayload } from '../types/auth';

const getErrorMessage = (error: any, fallbackMessage: string) => {
    return error.response?.data?.message || fallbackMessage;
};

export const login = async (email: string, password: string): Promise<AuthSessionResponse> => {
    try {
        const response = await api.post('/auth/login', { email, password });
        console.log('[Login Response] Status:', response.status);
        console.log('[Login Response] User:', response.data?.user);
        console.log('[Login Response] Token (first 30):', response.data?.accessToken?.substring(0, 30));

        if (response.data?.user) {
            response.data.user = new User(response.data.user);
        }
        return response.data;
    } catch (error: any) {
        throw new Error(getErrorMessage(error, 'Đã có lỗi xảy ra. Kiểm tra lại kết nối mạng.'));
    }
};

export const register = async (payload: RegisterPayload): Promise<AuthSessionResponse> => {
    try {
        const response = await api.post('/auth/register', payload);
        if (response.data?.user) {
            response.data.user = new User(response.data.user);
        }
        return response.data;
    } catch (error: any) {
        throw new Error(getErrorMessage(error, 'Đã có lỗi xảy ra. Vui lòng thử lại.'));
    }
};

export const updateProfile = async (firstName: string, lastName: string): Promise<UpdateProfileResponse> => {
    try {
        const response = await api.put('/auth/update-profile', { firstName, lastName });
        if (response.data?.user) {
            response.data.user = new User(response.data.user);
        }
        return response.data;
    } catch (error: any) {
        throw new Error(getErrorMessage(error, 'Cập nhật thất bại'));
    }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> => {
    try {
        const response = await api.put('/auth/change-password', { currentPassword, newPassword });
        return response.data;
    } catch (error: any) {
        throw new Error(getErrorMessage(error, 'Thay đổi mật khẩu thất bại'));
    }
};

export const forgotPassword = async (email: string): Promise<any> => {
    try {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    } catch (error: any) {
        throw new Error(getErrorMessage(error, 'Không thể gửi yêu cầu khôi phục mật khẩu'));
    }
};