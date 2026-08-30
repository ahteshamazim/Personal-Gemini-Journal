export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: number;
}

export type ReflectionMode = "reflect" | "summarize" | "brainstorm" | "action_items";

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
  mode?: ReflectionMode;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: string;
  messages: Message[];
  summary?: string;
  tags: string[];
  sentiment?: string;
  keyInsight?: string;
  isFavorite: boolean;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface PromptIdea {
  id: string;
  title: string;
  question: string;
  guidance: string;
}

export interface ReflectionResponse {
  success: boolean;
  reply: string;
  modelUsed: string;
  analysis: {
    summary: string;
    tags: string[];
    sentiment: string;
    keyInsight: string;
    suggestedTitle?: string;
  };
}
