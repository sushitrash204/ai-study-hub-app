import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function SettingsScreen({ navigation }: any) {
    const { logout, user } = useContext(AuthContext);

    const handleShowSupport = () => {
        Alert.alert(
            "Hỗ trợ Kỹ thuật",
            "Nếu bạn gặp sự cố, vui lòng liên hệ qua:\n\nEmail: nghia.nt.64cntt@ntu.edu.vn\nSĐT: 0383129381",
            [{ text: "Đóng", style: "cancel" }]
        );
    };

    const handleShowAppInfo = () => {
         Alert.alert(
            "Về ứng dụng",
            "Trí tuệ nhân tạo ôn thi DATN\nPhiên bản: 1.0.0\nTác giả: Nguyễn Thanh Nghĩa",
            [{ text: "Đóng", style: "cancel" }]
        );
    };

    const SettingItem = ({ icon, title, color = '#1C1C1E', onPress }: any) => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={styles.itemLeft}>
                <Ionicons name={icon} size={22} color={color} />
                <Text style={[styles.itemText, { color }]}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Cá nhân</Text>
                </View>

                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.firstName?.[0] || 'U'}{user?.lastName?.[0]}</Text>
                        </View>
                        <TouchableOpacity style={styles.editAvatarBtn} onPress={() => navigation.navigate('EditProfile')}>
                            <Ionicons name="pencil" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.name}>{user?.firstName || 'User'} {user?.lastName || ''}</Text>
                    <Text style={styles.email}>{user?.email || 'user@email.com'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tài khoản</Text>
                    <View style={styles.card}>
                        <SettingItem icon="person-outline" title="Chỉnh sửa thông tin" onPress={() => navigation.navigate('EditProfile')} />
                        <SettingItem icon="lock-closed-outline" title="Bảo mật" onPress={() => navigation.navigate('ChangePassword')} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Khác</Text>
                    <View style={styles.card}>
                        <SettingItem icon="help-circle-outline" title="Hỗ trợ" onPress={handleShowSupport} />
                        <SettingItem icon="information-circle-outline" title="Về ứng dụng" onPress={handleShowAppInfo} />
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutBtnText}>Đăng xuất</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    scrollContainer: { paddingBottom: 40 },
    header: { paddingHorizontal: 20, paddingTop: Constants.statusBarHeight + 10, paddingBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },

    profileSection: { alignItems: 'center', padding: 20, marginBottom: 10 },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FAFAFA',
    },
    name: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
    email: { fontSize: 14, color: '#6B7280', marginTop: 4 },

    section: { paddingHorizontal: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    itemText: { fontSize: 16, marginLeft: 15, fontWeight: '500' },

    logoutBtn: {
        marginHorizontal: 20,
        marginTop: 10,
        backgroundColor: '#FEE2E2',
        paddingVertical: 16,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    logoutBtnText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
