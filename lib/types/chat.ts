export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  tenantId?: string | null;
  createdAt: string;
  updatedAt?: string;
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
