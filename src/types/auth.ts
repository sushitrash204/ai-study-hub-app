// Auth related interfaces

import { User } from '../models/User';

export interface AuthSessionResponse {
    user: User;
    accessToken: string;
    message?: string;
}

export interface UpdateProfileResponse {
    user: User;
    message?: string;
}

export interface ChangePasswordResponse {
    message: string;
}

export interface RegisterPayload {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}
