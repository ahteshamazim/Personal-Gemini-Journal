export interface LocationTag {
  placeName: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: "user" | "admin";
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
  location?: LocationTag;
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

export type WebhookPlatform = "slack" | "discord" | "email" | "generic";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  userId: string;
  milestoneType: string;
  data: {
    id: string;
    title: string;
    category: string;
    summary?: string;
    keyInsight?: string;
    sentiment?: string;
    tags: string[];
    wordCount: number;
    turnCount: number;
    location?: LocationTag;
    updatedAt: string;
  };
  headers?: Record<string, string>;
  formatted: {
    slackBlocks?: any[];
    discordEmbed?: any;
    emailHtml?: string;
    genericJson?: any;
  };
}

export interface ModelHealthStatus {
  model: string;
  status: "healthy" | "degraded" | "unavailable";
  latencyMs: number;
  tier: "Primary" | "High-Availability" | "Dynamic Alias" | "Deep Reasoning";
  lastChecked: number;
}

export interface SystemHealthReport {
  timestamp: number;
  geminiConfigured: boolean;
  models: ModelHealthStatus[];
  firestoreIsolation: {
    rulesDeployed: boolean;
    ownerIsolationActive: boolean;
    piiProtected: boolean;
  };
  aggregateMetrics: {
    totalReflections: number;
    totalExchanges: number;
    totalWords: number;
    activeCategories: number;
  };
}
