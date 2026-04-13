// Study Group related interfaces

export type GroupRole = 'admin' | 'member';
export type GroupMemberStatus = 'active' | 'banned' | 'pending';
export type MessageType = 'TEXT' | 'DOCUMENT' | 'EXERCISE' | 'RESULT';
export type ResourceShareType = 'DOCUMENT' | 'EXERCISE';

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
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  GroupMembers?: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  status: GroupMemberStatus;
  joinedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    email: string;
  };
}

export interface GroupMessageData {
  _id: string;
  groupId: string;
  userId: string;
  content: string;
  type: MessageType;
  resourceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupInviteLinkData {
  id: string;
  groupId: string;
  inviteCode: string;
  expiredAt: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  isPublic?: boolean;
  avatarUrl?: string;
  rules?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  isPublic?: boolean;
  avatarUrl?: string;
  rules?: string;
}

export interface ShareResourcePayload {
  resourceId: string;
  resourceType: ResourceShareType;
}

export interface GroupListResponse {
  groups: StudyGroup[];
  total: number;
  page: number;
  limit: number;
}

// Alias for backward compatibility
export type StudyGroupData = StudyGroup;
export type GroupMemberData = GroupMember;
