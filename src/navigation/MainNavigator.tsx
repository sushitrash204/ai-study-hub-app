import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Subject
import SubjectDetailScreen from '../screens/subject/SubjectDetailScreen';
import LessonDetailScreen from '../screens/subject/LessonDetailScreen';

// Library
import DocumentSummaryScreen from '../screens/library/DocumentSummaryScreen';
import PDFViewerScreen from '../screens/library/PDFViewerScreen';
import DocumentListScreen from '../screens/library/DocumentListScreen';

// Exercise
import ExerciseDetailScreen from '../screens/exercise/ExerciseDetailScreen';
import ExerciseListScreen from '../screens/exercise/ExerciseListScreen';

// Chat
import ChatScreen from '../screens/chat/ChatScreen';

// Study Group
import StudyGroupDetailScreen from '../screens/study-group/StudyGroupDetailScreen';
import StudyGroupChatScreen from '../screens/study-group/StudyGroupChatScreen';

// Notifications
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationSettingsScreen from '../screens/notifications/NotificationSettingsScreen';

// Settings
import ProfileScreen from '../screens/settings/ProfileScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />

            {/* Auth */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

            {/* Subject */}
            <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
            <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />

            {/* Library */}
            <Stack.Screen name="DocumentSummary" component={DocumentSummaryScreen} />
            <Stack.Screen name="PDFViewer" component={PDFViewerScreen} />
            <Stack.Screen name="DocumentList" component={DocumentListScreen} />

            {/* Exercise */}
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="ExerciseList" component={ExerciseListScreen} />

            {/* Chat */}
            <Stack.Screen name="Chat" component={ChatScreen} />

            {/* Study Group */}
            <Stack.Screen name="StudyGroupDetail" component={StudyGroupDetailScreen} />
            <Stack.Screen name="StudyGroupChat" component={StudyGroupChatScreen} />

            {/* Notifications */}
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />

            {/* Settings */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Navigator>
    );
}
