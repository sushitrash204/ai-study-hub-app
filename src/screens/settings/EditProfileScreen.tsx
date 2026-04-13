import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { AuthContext } from '../../context/AuthContext';
import * as authService from '../../services/authService';

export default function EditProfileScreen({ navigation }: any) {
    const { user, updateUser } = useContext(AuthContext);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ và tên');
            return;
        }

        setIsLoading(true);
        try {
            const data = await authService.updateProfile(firstName, lastName);
            if (data?.user) {
                await updateUser(data.user);
                Alert.alert('Thành công', 'Cập nhật thông tin thành công');
                navigation.goBack();
            }
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Cập nhật thất bại');
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
                <Text style={styles.title}>Sửa thông tin</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tên (First Name)</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Nhập tên của bạn"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Họ (Last Name)</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Nhập họ của bạn"
                        />
                    </View>

                    {/* Email is read-only usually */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={user?.email || ''}
                            editable={false}
                        />
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
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    disabledInput: {
        backgroundColor: '#F3F4F6',
        color: '#9CA3AF',
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
