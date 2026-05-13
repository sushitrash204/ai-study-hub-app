import api from './api';

export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  avatarUrl?: string;
  rules?: string;
  ownerId: string;
  owner?: {
    id: string;
    fullName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  members?: any[];
  GroupMembers?: any[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  status: 'active' | 'banned' | 'pending';
  joinedAt: string;
  user?: {
    id: string;
    fullName: string;
    avatar?: string;
    email: string;
  };
}

export interface GroupMessage {
  _id: string;
  groupId: string;
  userId: string;
  content: string;
  type: 'TEXT' | 'DOCUMENT' | 'EXERCISE';
  resourceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupInviteLink {
  id: string;
  groupId: string;
  inviteCode: string;
  expiredAt: string;
}

/**
 * Create new study group
 */
export const createStudyGroup = async (
  name: string,
  data?: {
    description?: string;
    isPublic?: boolean;
    avatarUrl?: string;
    rules?: string;
  }
): Promise<StudyGroup> => {
  const response = await api.post('/study-groups', {
    name,
    ...data,
  });
  return response.data;
};

/**
 * List all public study groups
 */
export const listStudyGroups = async (page = 1, limit = 10, search?: string): Promise<any> => {
  const response = await api.get('/study-groups', {
    params: { page, limit, isPublic: true, search },
  });
  return response.data;
};

/**
 * Get user's study groups
 */
export const getUserStudyGroups = async (): Promise<StudyGroup[]> => {
  const response = await api.get('/study-groups/my-groups');
  return response.data;
};

/**
 * Get study group details
 */
export const getStudyGroupDetail = async (groupId: string): Promise<StudyGroup> => {
  const response = await api.get(`/study-groups/${groupId}`);
  return response.data;
};

/**
 * Update study group
 */
export const updateStudyGroup = async (
  groupId: string,
  data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    avatarUrl?: string;
    rules?: string;
  }
): Promise<StudyGroup> => {
  return api.put(`/study-groups/${groupId}`, data);
};

/**
 * Delete study group
 */
export const deleteStudyGroup = async (groupId: string): Promise<any> => {
  return api.delete(`/study-groups/${groupId}`);
};

/**
 * Get or create invite link
 */
export const getOrCreateInviteLink = async (groupId: string): Promise<GroupInviteLink> => {
  return api.post(`/study-groups/${groupId}/invite-link`);
};

/**
 * Join group using invite code
 */
export const joinByCode = async (code: string): Promise<any> => {
  const response = await api.post('/study-groups/join-by-code', { code });
  return response.data;
};

/**
 * Request to join private group
 */
export const requestJoinGroup = async (groupId: string): Promise<any> => {
  return api.post(`/study-groups/${groupId}/request-join`);
};

/**
 * Get group members
 */
export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  return api.get(`/study-groups/${groupId}/members`);
};

/**
 * Leave group
 */
export const leaveGroup = async (groupId: string): Promise<any> => {
  return api.post(`/study-groups/${groupId}/leave`);
};

/**
 * Get pending join requests (admin only)
 */
export const getPendingJoinRequests = async (groupId: string): Promise<any> => {
  return api.get(`/study-groups/${groupId}/join-requests`);
};

/**
 * Approve join request (admin only)
 */
export const approveJoinRequest = async (groupId: string, requestId: string): Promise<any> => {
  return api.post(
    `/study-groups/${groupId}/join-requests/${requestId}/approve`
  );
};

/**
 * Reject join request (admin only)
 */
export const rejectJoinRequest = async (groupId: string, requestId: string): Promise<any> => {
  return api.post(
    `/study-groups/${groupId}/join-requests/${requestId}/reject`
  );
};

/**
 * Promote member to admin (owner only)
 */
export const promoteToAdmin = async (groupId: string, memberId: string): Promise<any> => {
  return api.post(
    `/study-groups/${groupId}/members/${memberId}/promote`
  );
};

/**
 * Demote member to admin (owner only)
 */
export const demoteToMember = async (groupId: string, memberId: string): Promise<any> => {
  return api.post(
    `/study-groups/${groupId}/members/${memberId}/demote`
  );
};

/**
 * Ban member from group
 */
export const banMember = async (groupId: string, memberId: string): Promise<any> => {
  return api.post(
    `/study-groups/${groupId}/members/${memberId}/ban`
  );
};

/**
 * Send message to group
 */
export const sendMessage = async (
  groupId: string,
  content: string,
  type: 'TEXT' | 'DOCUMENT' | 'EXERCISE' = 'TEXT',
  resourceId?: string,
  replyToMessageId?: string
): Promise<GroupMessage> => {
  const response = await api.post(`/study-groups/${groupId}/messages`, {
    content,
    type,
    resourceId,
    replyToMessageId,
  });
  return response.data;
};

/**
 * Get group messages
 */
export const getMessages = async (
  groupId: string,
  limit = 50,
  offset = 0
): Promise<GroupMessage[]> => {
  const response = await api.get(`/study-groups/${groupId}/messages`, {
    params: { limit, offset },
  });
  return response.data;
};

/**
 * Share resource to group
 */
export const shareResource = async (
  groupId: string,
  resourceId: string,
  resourceType: 'DOCUMENT' | 'EXERCISE'
): Promise<any> => {
  return api.post(`/study-groups/${groupId}/share-resource`, {
    resourceId,
    resourceType,
  });
};

/**
 * Get shared resources in group
 */
export const getSharedResources = async (
  groupId: string,
  resourceType?: 'DOCUMENT' | 'EXERCISE'
): Promise<any> => {
  return api.get(`/study-groups/${groupId}/shared-resources`, {
    params: { resourceType },
  });
};

/**
 * Unshare resource from group
 */
export const unshareResource = async (
  groupId: string,
  sharedResourceId: string
): Promise<any> => {
  return api.delete(`/study-groups/${groupId}/shared-resources/${sharedResourceId}`);
};

/**
 * Upload group avatar
 */
export const uploadAvatar = async (
  groupId: string,
  file: any
): Promise<StudyGroup> => {
  const formData = new FormData();
  formData.append('avatar', file as any);

  const response = await api.post(`/study-groups/${groupId}/avatar`, formData);
  return response.data;
};

/**
 * AI Group Summary
 */
export const summarizeGroupChat = async (groupId: string): Promise<{ summary: string }> => {
  const response = await api.post(`/study-groups/${groupId}/ai/summary`);
  return response.data;
};

/**
 * AI Group Chat Assistant
 */
export const chatWithGroupAI = async (
  groupId: string, 
  message: string, 
  replyToMessageId?: string
): Promise<{ answer: string }> => {
  const response = await api.post(`/study-groups/${groupId}/ai/chat`, { 
    message,
    replyToMessageId
  });
  return response.data;
};

// ================= COMMUNITY POSTS =================

export const uploadPostImage = async (file: any): Promise<string> => {
  const formData = new FormData();
  
  // On Android, ensure the URI is properly formatted
  const uri = file.uri;

  formData.append('file', {
    uri: uri,
    type: file.type || 'image/jpeg',
    name: file.name || 'image.jpg',
  } as any);

  const response = await api.post('/study-groups/posts/upload-image', formData, {
    // DO NOT set Content-Type header manually, let Axios/FormData handle it
    // This is the most common cause of Network Error on Android
    transformRequest: (data) => {
      return data;
    },
  });
  return response.data.url;
};

export const createPost = async (groupId: string, content: string, subjectId?: string, imageFile?: any): Promise<any> => {
  let imageUrl = undefined;
  if (imageFile) {
    try {
      imageUrl = await uploadPostImage(imageFile);
    } catch (e) {
      console.error('Failed to upload post image:', e);
    }
  }

  const response = await api.post(`/study-groups/${groupId}/posts`, {
    content,
    imageUrl,
    subjectId,
  });
  return response.data;
};

export const getGroupPosts = async (groupId: string, page = 1, limit = 10): Promise<any> => {
  const response = await api.get(`/study-groups/${groupId}/posts`, {
    params: { page, limit },
  });
  return response.data;
};

export const getDiscoveryFeed = async (page = 1, limit = 10, subjectId?: string): Promise<any> => {
  const response = await api.get('/study-groups/discovery-feed', {
    params: { page, limit, subjectId },
  });
  return response.data;
};

export const togglePostLike = async (postId: string): Promise<any> => {
  const response = await api.post(`/study-groups/posts/${postId}/like`);
  return response.data;
};

export const getPostComments = async (postId: string): Promise<any> => {
  const response = await api.get(`/study-groups/posts/${postId}/comments`);
  return response.data;
};

export const createPostComment = async (postId: string, content: string, parentCommentId?: string): Promise<any> => {
  const response = await api.post(`/study-groups/posts/${postId}/comments`, { content, parentCommentId });
  return response.data;
};

export const createDiscoveryPost = async (content: string, imageFile?: any): Promise<any> => {
  let imageUrl = undefined;
  if (imageFile) {
    try {
      imageUrl = await uploadPostImage(imageFile);
    } catch (e) {
      console.error('Failed to upload discovery post image:', e);
    }
  }

  const response = await api.post('/study-groups/discovery-posts', {
    content,
    imageUrl,
  });
  return response.data;
};

export const deletePost = async (postId: string): Promise<any> => {
  const response = await api.delete(`/study-groups/posts/${postId}`);
  return response.data;
};

export const toggleSavePost = async (postId: string): Promise<{ saved: boolean }> => {
  const response = await api.post(`/study-groups/posts/${postId}/save`);
  return response.data;
};

export const getSavedPosts = async (page = 1, limit = 20): Promise<any> => {
  const response = await api.get('/study-groups/posts/saved', {
    params: { page, limit },
  });
  return response.data;
};
