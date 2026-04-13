import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as studyGroupService from '../../services/studyGroupService';
import {
  CreateGroupPayload,
  UpdateGroupPayload,
  ShareResourcePayload,
} from '../../types';

// Dùng type từ service (thực tế API trả về)
type StudyGroupData = studyGroupService.StudyGroup;
type GroupMemberData = studyGroupService.GroupMember;
type GroupMessageData = studyGroupService.GroupMessage;
type GroupInviteLinkData = studyGroupService.GroupInviteLink;

/**
 * Hook quản lý Study Groups - CRUD operations, members, messages, resources
 * @param options - { autoFetch?: boolean }
 * @returns state & actions để quản lý study groups
 */
export const useStudyGroups = (options: { autoFetch?: boolean } = {}) => {
  const { autoFetch = false } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [myGroups, setMyGroups] = useState<StudyGroupData[]>([]);
  const [publicGroups, setPublicGroups] = useState<StudyGroupData[]>([]);
  const [currentGroup, setCurrentGroup] = useState<StudyGroupData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberData[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessageData[]>([]);
  const [sharedResources, setSharedResources] = useState<any[]>([]);
  const [inviteLinks, setInviteLinks] = useState<GroupInviteLinkData[]>([]);

  // Fetch user's groups
  const fetchMyGroups = useCallback(async (isRefresh = false) => {
    isRefresh ? setIsRefreshing(true) : setIsLoading(true);
    try {
      const data = await studyGroupService.getUserStudyGroups();
      setMyGroups(data);
    } catch (error: any) {
      console.error('Fetch my groups error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch public groups
  const fetchPublicGroups = useCallback(
    async (page = 1, limit = 10, search?: string, isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      try {
        const response = await studyGroupService.listStudyGroups(page, limit);
        setPublicGroups(response.groups || []);
      } catch (error: any) {
        console.error('Fetch public groups error:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Fetch group detail
  const fetchGroupDetail = useCallback(async (groupId: string) => {
    setIsLoading(true);
    try {
      const data = await studyGroupService.getStudyGroupDetail(groupId);
      setCurrentGroup(data);
      return data;
    } catch (error: any) {
      console.error('Fetch group detail error:', error);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tải thông tin nhóm');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch group members
  const fetchGroupMembers = useCallback(async (groupId: string) => {
    setIsLoading(true);
    try {
      const data = await studyGroupService.getGroupMembers(groupId);
      setGroupMembers(data);
      return data;
    } catch (error: any) {
      console.error('Fetch group members error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch group messages
  const fetchGroupMessages = useCallback(
    async (groupId: string, limit = 50, offset = 0) => {
      setIsLoading(true);
      try {
        const data = await studyGroupService.getMessages(groupId, limit, offset);
        setGroupMessages(data);
        return data;
      } catch (error: any) {
        console.error('Fetch group messages error:', error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch shared resources
  const fetchSharedResources = useCallback(
    async (groupId: string, resourceType?: 'DOCUMENT' | 'EXERCISE') => {
      setIsLoading(true);
      try {
        const data = await studyGroupService.getSharedResources(groupId, resourceType);
        setSharedResources(data);
        return data;
      } catch (error: any) {
        console.error('Fetch shared resources error:', error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Create group
  const handleCreateGroup = useCallback(async (payload: CreateGroupPayload): Promise<StudyGroupData | null> => {
    setIsLoading(true);
    try {
      const data = await studyGroupService.createStudyGroup(payload.name, {
        description: payload.description,
        isPublic: payload.isPublic,
        avatarUrl: payload.avatarUrl,
        rules: payload.rules,
      });
      setMyGroups((prev) => [...prev, data]);
      return data;
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo nhóm');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update group
  const handleUpdateGroup = useCallback(
    async (groupId: string, payload: UpdateGroupPayload): Promise<StudyGroupData | null> => {
      setIsLoading(true);
      try {
        const data = await studyGroupService.updateStudyGroup(groupId, payload);
        setCurrentGroup(data);
        setMyGroups((prev) => prev.map((g) => (g.id === groupId ? data : g)));
        return data;
      } catch (error: any) {
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật nhóm');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Delete group
  const handleDeleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Xác nhận xóa',
        'Bạn có chắc muốn xóa nhóm này?',
        [
          { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              try {
                await studyGroupService.deleteStudyGroup(groupId);
                setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
                if (currentGroup?.id === groupId) {
                  setCurrentGroup(null);
                }
                Alert.alert('Thành công', 'Đã xóa nhóm thành công');
                resolve(true);
              } catch (error: any) {
                Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xóa nhóm');
                resolve(false);
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    });
  }, [currentGroup]);

  // Upload group avatar
  const handleUploadAvatar = useCallback(
    async (groupId: string, file: any): Promise<StudyGroupData | null> => {
      setIsLoading(true);
      try {
        const data = await studyGroupService.uploadAvatar(groupId, file);
        setCurrentGroup(data);
        setMyGroups((prev) => prev.map((g) => (g.id === groupId ? data : g)));
        return data;
      } catch (error: any) {
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tải lên ảnh đại diện');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Leave group
  const handleLeaveGroup = useCallback(async (groupId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Xác nhận',
        'Bạn có chắc muốn rời khỏi nhóm này?',
        [
          { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Rời nhóm',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              try {
                await studyGroupService.leaveGroup(groupId);
                setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
                if (currentGroup?.id === groupId) {
                  setCurrentGroup(null);
                }
                Alert.alert('Thành công', 'Đã rời khỏi nhóm');
                resolve(true);
              } catch (error: any) {
                Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể rời nhóm');
                resolve(false);
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    });
  }, [currentGroup]);

  // Invite link
  const handleGetInviteLink = useCallback(async (groupId: string): Promise<GroupInviteLinkData | null> => {
    setIsLoading(true);
    try {
      const data = await studyGroupService.getOrCreateInviteLink(groupId);
      return data;
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo liên kết mời');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Join by code
  const handleJoinByCode = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await studyGroupService.joinByCode(code);
      Alert.alert('Thành công', 'Đã tham gia nhóm thành công');
      return true;
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tham gia nhóm');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Member management
  const handlePromoteToAdmin = useCallback(
    async (groupId: string, memberId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        await studyGroupService.promoteToAdmin(groupId, memberId);
        await fetchGroupMembers(groupId);
        return true;
      } catch (error: any) {
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể thăng chức');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchGroupMembers]
  );

  const handleDemoteToMember = useCallback(
    async (groupId: string, memberId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        await studyGroupService.demoteToMember(groupId, memberId);
        await fetchGroupMembers(groupId);
        return true;
      } catch (error: any) {
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể giáng chức');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchGroupMembers]
  );

  const handleBanMember = useCallback(
    async (groupId: string, memberId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        await studyGroupService.banMember(groupId, memberId);
        await fetchGroupMembers(groupId);
        return true;
      } catch (error: any) {
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cấm thành viên');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchGroupMembers]
  );

  // Share resource
  const handleShareResource = useCallback(
    async (groupId: string, payload: ShareResourcePayload): Promise<boolean> => {
      setIsLoading(true);
      try {
        await studyGroupService.shareResource(groupId, payload.resourceId, payload.resourceType);
        await fetchSharedResources(groupId);
        return true;
      } catch (error: any) {
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể chia sẻ tài liệu');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSharedResources]
  );

  const handleUnshareResource = useCallback(
    async (groupId: string, sharedResourceId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        await studyGroupService.unshareResource(groupId, sharedResourceId);
        setSharedResources((prev) => prev.filter((r) => r.id !== sharedResourceId));
        return true;
      } catch (error: any) {
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể hủy chia sẻ');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Clear current group
  const clearCurrentGroup = useCallback(() => {
    setCurrentGroup(null);
    setGroupMembers([]);
    setGroupMessages([]);
    setSharedResources([]);
  }, []);

  // Auto fetch
  useEffect(() => {
    if (autoFetch) {
      fetchMyGroups();
    }
  }, [autoFetch, fetchMyGroups]);

  return {
    state: {
      isLoading,
      isRefreshing,
      myGroups,
      publicGroups,
      currentGroup,
      groupMembers,
      groupMessages,
      sharedResources,
      inviteLinks,
    },
    actions: {
      fetchMyGroups,
      fetchPublicGroups,
      fetchGroupDetail,
      fetchGroupMembers,
      fetchGroupMessages,
      fetchSharedResources,
      handleCreateGroup,
      handleUpdateGroup,
      handleDeleteGroup,
      handleUploadAvatar,
      handleLeaveGroup,
      handleGetInviteLink,
      handleJoinByCode,
      handlePromoteToAdmin,
      handleDemoteToMember,
      handleBanMember,
      handleShareResource,
      handleUnshareResource,
      clearCurrentGroup,
    },
  };
};
