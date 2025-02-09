export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  preview?: string; // HTML preview content
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}