import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import LibraryScreen from '../screens/library/LibraryScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import StudyGroupsListScreen from '../screens/study-group/StudyGroupsListScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Library') {
                        iconName = focused ? 'library' : 'library-outline';
                    } else if (route.name === 'Chat') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'StudyGroups') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#8B5CF6',
                tabBarInactiveTintColor: '#9CA3AF',
                headerShown: false,
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 10,
                    paddingTop: 5,
                }
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Môn học' }} />
            <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Thư viện' }} />
            <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: 'AI Chat' }} />
            <Tab.Screen name="StudyGroups" component={StudyGroupsListScreen} options={{ tabBarLabel: 'Học nhóm' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Cá nhân' }} />
        </Tab.Navigator>
    );
}
