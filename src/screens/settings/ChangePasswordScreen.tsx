import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as authService from '../../services/authService';

export default function ChangePasswordScreen({ navigation }: any) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Toggle password visibility
    const [showCurr, setShowCurr] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConf, setShowConf] = useState(false);

    const handleSave = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường mật khẩu');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }

        if (newPassword.length < 6) {
             Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
             return;
        }

        setIsLoading(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            Alert.alert('Thành công', 'Đổi mật khẩu thành công');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Thay đổi mật khẩu thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Đổi mật khẩu</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Mật khẩu hiện tại</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Nhập mật khẩu cũ"
                                secureTextEntry={!showCurr}
                            />
                            <TouchableOpacity onPress={() => setShowCurr(!showCurr)} style={styles.eyeIcon}>
                                 <Ionicons name={showCurr ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Mật khẩu mới</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Nhập mật khẩu mới"
                                secureTextEntry={!showNew}
                            />
                            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                                 <Ionicons name={showNew ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Nhập lại mật khẩu mới"
                                secureTextEntry={!showConf}
                            />
                            <TouchableOpacity onPress={() => setShowConf(!showConf)} style={styles.eyeIcon}>
                                 <Ionicons name={showConf ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.saveBtn} 
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Constants.statusBarHeight + 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
    content: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4B5563',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
    },
    input: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    eyeIcon: {
        padding: 12,
    },
    saveBtn: {
        backgroundColor: '#8B5CF6',
        borderRadius: 15,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
