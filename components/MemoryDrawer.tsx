import React, { useState } from 'react';
import { MemoryItem } from '../types';

interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (memory: Omit<MemoryItem, 'id' | 'createdAt'>) => void;
  onTogglePin: (id: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories?: () => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onTogglePin,
  onDeleteMemory,
  onClearAllMemories,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('coding_style');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddMemory({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      isPinned: true,
    });
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-md modal-backdrop animate-fade-in-up duration-200">
      <div className="w-full max-w-md h-full glass-elevated border-l border-white/15 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-slide-in-right">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/12">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 animate-orb-pulse">
                <i className="fas fa-microchip text-base" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display tracking-tight">Arc AI Long-Term Memory</h3>
                <p className="text-xs text-slate-400">Persistent user context & directives</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onClearAllMemories && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all stored memories and reset context?')) {
                      onClearAllMemories();
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors duration-300"
                  title="Clear All Memory & Profiles"
                >
                  <i className="fas fa-trash-alt text-[10px]" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full glass-button text-slate-400 hover:text-white flex items-center justify-center transition-colors duration-300"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            {!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full btn-radiant py-2.5 rounded-xl font-semibold text-xs text-white shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-300"
              >
                <i className="fas fa-plus text-xs" />
                Add New AI Context Preference
              </button>
            ) : (
              <form onSubmit={handleCreate} className="glass-card p-4 rounded-xl border border-cyan-500/40 space-y-3 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 font-display tracking-tight">New Context Rule</span>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="text-slate-400 hover:text-white text-xs transition-colors duration-300"
                  >
                    Cancel
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Title (e.g. Always use TypeScript & React 19)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs text-white"
                />

                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full glass-select rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="coding_style">Coding Style & Stack</option>
                  <option value="user_bio">User Bio & Background</option>
                  <option value="project_rules">Project Architecture Rules</option>
                  <option value="preferences">General AI Preferences</option>
                </select>

                <textarea
                  placeholder="Detailed instructions/context for Arc AI..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full glass-textarea rounded-lg px-3 py-2 text-xs text-white resize-none"
                />

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors duration-300"
                >
                  Save Context Item
                </button>
              </form>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 font-mono">
              <span>Active Pinned Context ({memories.length})</span>
              <span className="text-[10px] text-cyan-400 tracking-wide">Auto-injected into prompts</span>
            </div>

            {memories.map((mem) => (
              <div
                key={mem.id}
                className={`glass-card p-3.5 rounded-xl border transition-all duration-300 ${
                  mem.isPinned ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/10 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTogglePin(mem.id)}
                      className={`text-xs transition-colors duration-300 ${
                        mem.isPinned ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'
                      }`}
                      title={mem.isPinned ? 'Pinned context' : 'Pin context'}
                    >
                      <i className="fas fa-thumbtack" />
                    </button>
                    <span className="text-xs font-bold text-white font-display tracking-tight">{mem.title}</span>
                  </div>

                  <button
                    onClick={() => onDeleteMemory(mem.id)}
                    className="text-slate-500 hover:text-red-400 text-xs transition-colors duration-300"
                  >
                    <i className="fas fa-trash-alt" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{mem.content}</p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 capitalize font-mono text-cyan-300">
                    {mem.category.replace('_', ' ')}
                  </span>
                  <span>{mem.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/12 text-center">
          <p className="text-[11px] text-slate-500">
            Arc AI automatically retains user preferences to deliver custom responses.
          </p>
        </div>
      </div>
    </div>
  );
};
