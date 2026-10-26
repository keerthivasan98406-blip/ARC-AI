export enum MessageRole {
  USER = 'user',
  ARC_BOT = 'model',
}

export type ModelEngine = 'gpt-5' | 'claude-3-5' | 'gemini-1-5' | 'deepseek-r1' | 'llama-3-3';

export interface ModelEngineInfo {
  id: ModelEngine;
  name: string;
  provider: string;
  badge: string;
  color: string;
  icon: string;
  description: string;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  favicon?: string;
}

export interface MessagePart {
  text?: string;
  image?: string;
  video?: string;
  code?: string;
  language?: string;
  audioUrl?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  parts?: MessagePart[];
  timestamp: Date;
  isStreaming?: boolean;
  modelUsed?: ModelEngine;
  citations?: Citation[];
  thoughtProcess?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface AppState {
  messages: Message[];
  isLoading: boolean;
  currentInput: string;
  history: ChatHistoryItem[];
  selectedModel: ModelEngine;
  isWebSearchEnabled: boolean;
  isVoiceActive: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  history: ChatHistoryItem[];
  modelUsed: ModelEngine;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: 'user_bio' | 'coding_style' | 'project_rules' | 'preferences';
  isPinned: boolean;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  // Support both question/answer and front/back conventions
  question?: string;
  answer?: string;
  front?: string;
  back?: string;
  topic?: string;
  tags?: string[];
  mastered?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ImageStudioPreset {
  id: string;
  name: string;
  promptModifier: string;
  previewGradient: string;
  icon: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeChats: number;
  tokenRequests: number;
  storageFootprintGB: number;
  apiLatencyMs: number;
  errorCount24h: number;
}
