import React, { useState } from 'react';
import { ChatSession } from '../types';
import { ArcLogo } from './ArcLogo';
import { SidebarIcon } from './SidebarIcon';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenStudyHub: () => void;
  onOpenImageStudio: () => void;
  onOpenCodeVisualizer: () => void;
  onOpenMemoryDrawer: () => void;
  onOpenAdminDashboard: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenStudyHub,
  onOpenImageStudio,
  onOpenCodeVisualizer,
  onOpenMemoryDrawer,
  onOpenAdminDashboard,
  onLogout,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  const handleQuickLaunch = (fn: () => void) => {
    fn();
    setMoreOpen(false);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar-running-border h-full bg-[#080C14]/98 lg:bg-[#080C14]/90 border-r border-white/10 flex-col backdrop-blur-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? '!fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] p-4 opacity-100 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex lg:!relative lg:inset-auto lg:z-40 lg:shadow-none'
            : 'hidden lg:flex lg:!relative lg:inset-auto lg:z-40 lg:w-0 lg:p-0 lg:opacity-0 lg:border-r-0 lg:overflow-hidden'
        }`}
        style={{ minWidth: 0, overflow: isOpen ? 'visible' : 'hidden' }}
      >
        {/* Slide-close tab on the right edge (desktop only) */}
        {isOpen && (
          <button
            onClick={onToggle}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-3 h-12 items-center justify-center bg-[#0d1020] border border-white/15 border-l-0 rounded-r-md hover:bg-purple-900/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <i className="fas fa-chevron-left text-[8px] text-slate-500 group-hover:text-purple-300 transition-colors" />
          </button>
        )}
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <ArcLogo size="md" />
            {/* Close button for mobile */}
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <i className="fas fa-times text-sm" />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full btn-radiant py-3 rounded-2xl font-bold text-xs text-white shadow-[0_0_24px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 transition-all duration-300 group cursor-pointer"
          >
            <i className="fas fa-plus text-xs group-hover:rotate-90 transition-transform duration-300" />
            <span>Start New Arc AI Chat</span>
          </button>

          {/* More Button */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <i className={`fas fa-grid-2 text-purple-400 text-xs transition-transform duration-300 ${moreOpen ? 'rotate-90' : ''}`} />
                <span className="text-xs font-bold text-slate-300 group-hover:text-white tracking-wide">More</span>
              </div>
              <i className={`fas fa-chevron-down text-[10px] text-slate-500 group-hover:text-purple-400 transition-all duration-300 ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div className="mt-2 rounded-2xl border border-white/10 bg-[#0d1117]/95 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/40 animate-fade-in-up">
                {/* Quick Launch Grid */}
                <div className="p-3 grid grid-cols-3 gap-2 border-b border-white/5">
                  <button
                    onClick={() => handleQuickLaunch(onOpenStudyHub)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-400/50 hover:bg-purple-500/20 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <i className="fas fa-graduation-cap text-xs" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white tracking-wide">Study Hub</span>
                  </button>

                  <button
                    onClick={() => handleQuickLaunch(onOpenImageStudio)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 hover:border-pink-400/50 hover:bg-pink-500/20 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <i className="fas fa-palette text-xs" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white tracking-wide">Image AI</span>
                  </button>

                  <button
                    onClick={() => handleQuickLaunch(onOpenCodeVisualizer)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/20 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <i className="fas fa-code text-xs" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white tracking-wide">Code Flow</span>
                  </button>
                </div>

                {/* Neural Tools inside More */}
                <div className="p-3 space-y-1">
                  <div className="px-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
                    Neural Tools
                  </div>

                  <button
                    onClick={() => handleQuickLaunch(onOpenMemoryDrawer)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-purple-500/15 border border-transparent hover:border-purple-500/30 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <i className="fas fa-brain text-purple-400 text-xs w-4 text-center group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white tracking-tight">Context Memory</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400">Personal AI memory</span>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-[10px] text-slate-500 group-hover:text-purple-400 transition-all duration-300" />
                  </button>

                  <button
                    onClick={() => handleQuickLaunch(onOpenAdminDashboard)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/30 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <i className="fas fa-chart-line text-cyan-400 text-xs w-4 text-center group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white tracking-tight">Analytics & Performance</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400">AI latency & token metrics</span>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-[10px] text-slate-500 group-hover:text-cyan-400 transition-all duration-300" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            <div className="px-1 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono flex items-center justify-between">
              <span>Recent Threads</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px]">{sessions.length}</span>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 font-light">
                No active chat threads yet.
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === currentSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/25 via-indigo-500/20 to-pink-500/15 border border-purple-500/40 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                        : 'hover:bg-white/5 border border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(139,92,246,0.9)] animate-pulse shrink-0" />
                      ) : (
                        <i className="fas fa-comment-alt text-xs text-slate-500 group-hover:text-purple-300 shrink-0" />
                      )}
                      <span className={`text-xs truncate tracking-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                        {session.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs p-1 transition-all duration-300"
                      title="Delete Session"
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-white/10 space-y-2">
            {/* Claim Offer Button */}
            <button
              onClick={() => setClaimModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600/30 to-pink-600/20 border border-purple-500/40 hover:border-purple-400/70 hover:from-purple-600/40 hover:to-pink-600/30 transition-all duration-300 group cursor-pointer"
            >
              <i className="fas fa-gift text-purple-300 text-xs group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xs font-bold text-purple-200 group-hover:text-white tracking-wide">Claim Offer</span>
            </button>

            {/* Log Out Button */}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 transition-all duration-300 group cursor-pointer"
            >
              <i className="fas fa-sign-out-alt text-slate-400 text-xs group-hover:text-red-400 transition-colors duration-300" />
              <span className="text-xs font-bold text-slate-400 group-hover:text-red-300 tracking-wide">Log Out</span>
            </button>
          </div>

          {/* Claim Offer Modal */}
          {claimModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
              onClick={() => setClaimModalOpen(false)}
            >
              <div
                className="relative w-full max-w-sm rounded-3xl border border-purple-500/40 bg-[#0d1117]/95 backdrop-blur-xl shadow-2xl shadow-purple-900/40 p-6 animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Glow blob */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/20 rounded-full blur-[50px] pointer-events-none" />

                {/* Close */}
                <button
                  onClick={() => setClaimModalOpen(false)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="fas fa-times text-[10px] text-slate-400" />
                </button>

                {/* Content */}
                <div className="relative flex flex-col items-center text-center gap-4">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <i className="fas fa-rocket text-white text-2xl" />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 font-mono mb-1">
                      Coming Soon
                    </p>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      Exciting Updates on the Way
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      We're working on something big. New features, pro plans, and exclusive offers will be available very soon. Stay tuned!
                    </p>
                  </div>

                  {/* Pulse dots */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>

                  <button
                    onClick={() => setClaimModalOpen(false)}
                    className="w-full btn-radiant py-2.5 rounded-2xl text-xs font-bold text-white mt-1 cursor-pointer"
                  >
                    Got it, I'll wait!
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
