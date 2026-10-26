// Database Service - Connects frontend to MongoDB backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

// User Authentication
export const loginUser = async (name: string, email: string): Promise<User> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

    if (!response.ok) {
      throw new Error('Failed to login user');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    throw error;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/users/${email}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
};

// Create new chat session
export const createChatSession = async (
  userId: string, 
  userEmail: string, 
  title?: string
): Promise<ChatSession> => {
  try {
    const response = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userEmail, title })
    });

    if (!response.ok) {
      throw new Error('Failed to create chat session');
    }

    const data = await response.json();
    return data.session;
  } catch (error) {
    throw error;
  }
};

// Get all sessions for a user
export const getUserSessions = async (email: string): Promise<ChatSession[]> => {
  try {
    const response = await fetch(`${API_URL}/sessions/user/${email}`);

    if (!response.ok) {
      throw new Error('Failed to get user sessions');
    }

    const data = await response.json();
    return data.sessions;
  } catch (error) {
    return [];
  }
};

// Save message to database
export const saveMessage = async (
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: any
): Promise<ChatMessage> => {
  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, role, content, metadata })
    });

    if (!response.ok) {
      throw new Error('Failed to save message');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    throw error;
  }
};

// Get all messages for a session
export const getSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(`${API_URL}/messages/session/${sessionId}`);

    if (!response.ok) {
      throw new Error('Failed to get session messages');
    }

    const data = await response.json();
    return data.messages;
  } catch (error) {
    return [];
  }
};

// Delete session
export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete session');
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Deploy generated website to local disk
export const saveSiteToDisk = async (
  htmlCode: string,
  fileName: string
): Promise<{ success: boolean; url: string; filePath: string; fileName: string }> => {
  try {
    const response = await fetch(`${API_URL}/save-site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ htmlCode, fileName })
    });

    if (!response.ok) {
      throw new Error('Failed to save website locally');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
