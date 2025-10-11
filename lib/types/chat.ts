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
}

export interface ChatUser {
  id: string;
  name: string;
}
