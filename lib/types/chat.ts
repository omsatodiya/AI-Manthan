export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  tenantId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  tenantId?: string | null;
  reactionType: ReactionType;
  createdAt: string;
}

export interface ReactionGroup {
  type: ReactionType;
  count: number;
  users: Array<{ id: string; name: string }>;
  hasUserReacted: boolean;
}

export interface ChatMessageWithUser {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  attachment?: MessageAttachment | null;
  reactions?: ReactionGroup[];
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
}

export interface ChatUser {
  id: string;
  name: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  userId: string;
  attachmentId?: string | null;
}

export interface UpdateMessagePayload {
  messageId: string;
  content: string;
  userId: string;
  updatedAt: string;
}

export interface UploadFileParams {
  file: File;
  userId: string;
  tenantId?: string | null;
}

export interface AddReactionPayload {
  messageId: string;
  userId: string;
  userName: string;
  reactionType: ReactionType;
  tenantId?: string | null;
}

export interface RemoveReactionPayload {
  messageId: string;
  userId: string;
  reactionType: ReactionType;
}
