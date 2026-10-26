 import React, { useState, useEffect } from 'react';
import { AuroraBackground } from './components/AuroraBackground';
import { Sidebar } from './components/Sidebar';
import { ChatContainer } from './components/ChatContainer';
import { StudyHubModal } from './components/StudyHubModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { CodeVisualizerModal } from './components/CodeVisualizerModal';
import { MemoryDrawer } from './components/MemoryDrawer';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { FloatingAssistantButton } from './components/FloatingAssistantButton';
import { Message, MessageRole, ModelEngine, ChatSession, MemoryItem } from './types';
import { chatWithArcAi } from './services/geminiService';

const App: React.FC = () => {
  const loadSavedSessions = (): ChatSession[] => {
    try {
      const saved = localStorage.getItem('arc_ai_chat_sessions');
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        return parsed.filter((s) => !s.title.toLowerCase().includes('leonux'));
      }
    } catch (e) {}
    return [];
  };

  const loadSavedMemories = (): MemoryItem[] => {
    try {
      const saved = localStorage.getItem('arc_ai_memories');
      if (saved) {
        const parsed: MemoryItem[] = JSON.parse(saved);
        const cleaned = parsed.filter(
          (m) =>
            !m.title.toLowerCase().includes('leonux') &&
            !m.content.toLowerCase().includes('leonux')
        );
        return cleaned;
      }
    } catch (e) {}
    return [
      {
        id: 'mem-1',
        title: 'Glassmorphic Design Blueprint',
        content: 'Enforce futuristic glassmorphism OS design with backdrop-filter blur(36px), radiant linear button gradients, and cyan glow.',
        category: 'project_rules',
        isPinned: true,
        createdAt: '2026-08-07',
      },
      {
        id: 'mem-2',
        title: 'Code Formatting Guidelines',
        content: 'Always provide clean, syntax-highlighted code blocks with copy headers and KaTeX LaTeX formulas.',
        category: 'coding_style',
        isPinned: true,
        createdAt: '2026-08-07',
      },
    ];
  };

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(loadSavedSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedModel, setSelectedModel] = useState<ModelEngine>('claude-3-5');
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isStudyHubOpen, setIsStudyHubOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isCodeVisualizerOpen, setIsCodeVisualizerOpen] = useState(false);
  const [codeToVisualize, setCodeToVisualize] = useState<string>('');
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  const [memories, setMemories] = useState<MemoryItem[]>(loadSavedMemories);

  useEffect(() => {
    try {
      localStorage.setItem('arc_ai_chat_sessions', JSON.stringify(chatSessions));
    } catch (e) {}
  }, [chatSessions]);

  useEffect(() => {
    try {
      localStorage.setItem('arc_ai_memories', JSON.stringify(memories));
    } catch (e) {}
  }, [memories]);

  const handleSelectSession = (id: string) => {
    const found = chatSessions.find((s) => s.id === id);
    if (found) {
      setCurrentSessionId(id);
      setMessages(found.messages);
      setSelectedModel(found.modelUsed || 'gpt-5');
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    const updated = chatSessions.filter((s) => s.id !== id);
    setChatSessions(updated);
    if (currentSessionId === id) {
      handleNewChat();
    }
  };

  const handleAddMemory = (newMem: Omit<MemoryItem, 'id' | 'createdAt'>) => {
    const item: MemoryItem = {
      ...newMem,
      id: `mem-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setMemories((prev) => [item, ...prev]);
  };

  const handleTogglePinMemory = (id: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPinned: !m.isPinned } : m))
    );
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMemories = () => {
    try {
      localStorage.removeItem('arc_ai_memories');
      localStorage.removeItem('arc_ai_chat_sessions');
      localStorage.removeItem('arc_ai_user_profile');
      Object.keys(localStorage).forEach((key) => {
        if (
          key.toLowerCase().includes('leonux') ||
          key.toLowerCase().includes('arc_ai')
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
    setMemories([]);
    setChatSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
  };

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: MessageRole.USER,
      content: text,
      parts: imageBase64 ? [{ image: imageBase64 }] : undefined,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const assistantMsgId = `msg-${Date.now() + 1}`;
    const placeholderAssistantMsg: Message = {
      id: assistantMsgId,
      role: MessageRole.ARC_BOT,
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      modelUsed: selectedModel,
    };

    setMessages((prev) => [...prev, placeholderAssistantMsg]);

    const history = newMessages.map((m) => ({
      role: m.role === MessageRole.USER ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    }));

    try {
      const result = await chatWithArcAi(
        text,
        history,
        (streamedText) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: streamedText, isStreaming: true }
                : m
            )
          );
        },
        imageBase64,
        selectedModel,
        isWebSearchEnabled
      );

      const finalAssistantMsg: Message = {
        id: assistantMsgId,
        role: MessageRole.ARC_BOT,
        content: result.text,
        timestamp: new Date(),
        isStreaming: false,
        modelUsed: selectedModel,
        citations: result.citations,
      };

      const updatedMessages = [...newMessages, finalAssistantMsg];
      setMessages(updatedMessages);

      if (!currentSessionId) {
        const newSessionId = `session-${Date.now()}`;
        const title = text.slice(0, 40) + (text.length > 40 ? '...' : '');
        const newSession: ChatSession = {
          id: newSessionId,
          title,
          messages: updatedMessages,
          history,
          modelUsed: selectedModel,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setCurrentSessionId(newSessionId);
        setChatSessions((prev) => [newSession, ...prev]);
      } else {
        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: updatedMessages, updatedAt: new Date() }
              : s
          )
        );
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: 'An error occurred while communicating with Arc AI Neural Gateway. Please check your connectivity and try again.',
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRegenerateLastResponse = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === MessageRole.USER);
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleEditMessage = (id: string, newText: string) => {
    const msgIndex = messages.findIndex((m) => m.id === id);
    if (msgIndex !== -1) {
      const truncated = messages.slice(0, msgIndex);
      setMessages(truncated);
      handleSendMessage(newText);
    }
  };

  const handleSendImageStudioToChat = (imageUrl: string, prompt: string) => {
    handleSendMessage(`Generated Artwork for prompt: "${prompt}"`, imageUrl);
  };

  const handleLogout = () => {
    // Clear all local storage and reset state
    try {
      localStorage.removeItem('arc_ai_chat_sessions');
      localStorage.removeItem('arc_ai_memories');
      localStorage.removeItem('arc_ai_user_profile');
    } catch (e) {}
    setChatSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
    setMemories([]);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent flex flex-row p-0 animate-fade-in-up arc-app-shell">
      <AuroraBackground />

      <div className="relative flex-1 min-w-0 h-full glass-os border border-purple-500/20 overflow-hidden flex flex-row shadow-2xl z-10 chat-panel-3d arc-app-frame" style={{boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.06)'}}>
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          sessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onOpenStudyHub={() => setIsStudyHubOpen(true)}
          onOpenImageStudio={() => setIsImageStudioOpen(true)}
          onOpenCodeVisualizer={() => {
            setCodeToVisualize('');
            setIsCodeVisualizerOpen(true);
          }}
          onOpenMemoryDrawer={() => setIsMemoryDrawerOpen(true)}
          onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
          onLogout={handleLogout}
        />

        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          isWebSearchEnabled={isWebSearchEnabled}
          onToggleWebSearch={setIsWebSearchEnabled}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onDeleteMessage={handleDeleteMessage}
          onRegenerateLastResponse={handleRegenerateLastResponse}
          onEditMessage={handleEditMessage}
          onOpenCodeVisualizer={(code) => {
            setCodeToVisualize(code || '');
            setIsCodeVisualizerOpen(true);
          }}
        />
      </div>

      <StudyHubModal
        isOpen={isStudyHubOpen}
        onClose={() => setIsStudyHubOpen(false)}
        onSendToChat={(text) => handleSendMessage(text)}
      />

      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onSendImageToChat={handleSendImageStudioToChat}
      />

      <CodeVisualizerModal
        isOpen={isCodeVisualizerOpen}
        onClose={() => setIsCodeVisualizerOpen(false)}
        initialCode={codeToVisualize}
      />

      <MemoryDrawer
        isOpen={isMemoryDrawerOpen}
        onClose={() => setIsMemoryDrawerOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onTogglePin={handleTogglePinMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearAllMemories={handleClearAllMemories}
      />

      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
      />

      {/* Floating Assistant — always visible on every screen */}
      <FloatingAssistantButton />
    </div>
  );
};

export default App;
