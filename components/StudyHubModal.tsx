import React, { useState } from 'react';
import { Flashcard, QuizQuestion } from '../types';
import { chatWithArcAi } from '../services/geminiService';

interface StudyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const SAMPLE_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    topic: 'Computer Science',
    front: 'What is Time Complexity of QuickSort in the average vs worst case?',
    back: 'Average Case: O(n log n)\nWorst Case: O(n²) when the pivot selection is unbalanced.',
  },
  {
    id: 'fc-2',
    topic: 'Artificial Intelligence',
    front: 'What is the function of Attention Mechanism in Transformer architecture?',
    back: 'It dynamically computes weighted connections between words across sequences, allowing parallel context modeling.',
  },
  {
    id: 'fc-3',
    topic: 'Web Development',
    front: 'What is the difference between Virtual DOM and Shadow DOM?',
    back: 'Virtual DOM is a lightweight React in-memory copy of UI.\nShadow DOM provides web component encapsulation CSS isolation.',
  },
];

export const StudyHubModal: React.FC<StudyHubModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'generator'>('flashcards');
  const [flashcards, setFlashcards] = useState<Flashcard[]>(SAMPLE_FLASHCARDS);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [topicInput, setTopicInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const currentCard = flashcards[currentCardIndex];

  const handleGenerateStudySet = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);

    const prompt = `Generate 4 educational study flashcards for topic: "${topicInput.trim()}".
Return JSON format:
[
  { "front": "Question/Concept", "back": "Clear concise explanation", "topic": "${topicInput.trim()}" }
]`;

    try {
      const result = await chatWithArcAi(prompt, [], () => {}, undefined, 'claude-3-5');
      let cleanJson = result.text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(cleanJson);
      const newCards: Flashcard[] = parsed.map((item: any, idx: number) => ({
        id: `gen-${Date.now()}-${idx}`,
        topic: item.topic || topicInput,
        front: item.front,
        back: item.back,
      }));

      setFlashcards(newCards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setActiveTab('flashcards');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="w-full max-w-4xl max-h-[90vh] glass-elevated rounded-3xl border border-purple-500/30 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto relative animate-fade-in-scale">
        <div className="flex items-center justify-between pb-4 border-b border-white/12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-graduation-cap text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display tracking-tight">
                Arc AI Study Hub & Knowledge Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Interactive flashcards, quiz generator & AI topic summarization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full glass-button text-slate-400 hover:text-white flex items-center justify-center transition-colors duration-300"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="flex items-center gap-2 my-4 border-b border-white/10 pb-2">
          {[
            { id: 'flashcards', label: 'Flashcards Studio', icon: 'fa-clone' },
            { id: 'generator', label: 'AI Study Generator', icon: 'fa-wand-magic-sparkles' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg'
                  : 'glass-button text-slate-400 hover:text-white'
              }`}
            >
              <i className={`fas ${tab.icon}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'flashcards' && (
          <div className="flex flex-col items-center justify-center my-6 space-y-6">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full max-w-lg min-h-[220px] p-6 rounded-3xl glass-card border border-purple-500/40 shadow-2xl flex flex-col justify-between cursor-pointer hover:border-purple-400/80 transition-all duration-300 relative group"
            >
              <div className="flex items-center justify-between text-xs text-purple-400 font-mono">
                <span className="font-bold uppercase tracking-wider">{currentCard?.topic}</span>
                <span>Click card to {isFlipped ? 'see Front' : 'reveal Answer'}</span>
              </div>

              <div className="my-6 text-center">
                {isFlipped ? (
                  <p className="text-base text-cyan-300 font-medium leading-relaxed animate-fade-in-up whitespace-pre-wrap">
                    {currentCard?.back}
                  </p>
                ) : (
                  <h3 className="text-lg font-bold text-white font-display leading-snug animate-fade-in-up">
                    {currentCard?.front}
                  </h3>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
                <span className="text-purple-300 group-hover:text-white transition-colors">
                  <i className="fas fa-sync-alt mr-1" /> Flip
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                }}
                className="px-4 py-2 rounded-xl glass-button text-xs text-white flex items-center gap-2"
              >
                <i className="fas fa-chevron-left" /> Previous
              </button>

              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentCardIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                Next Card <i className="fas fa-chevron-right" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="my-6 space-y-4 max-w-lg mx-auto w-full">
            <div>
              <label className="text-xs font-bold text-white block mb-1.5">
                Topic or Subject to Study
              </label>
              <input
                type="text"
                placeholder="e.g. Quantum Computing, React Hooks, Organic Chemistry..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <button
              onClick={handleGenerateStudySet}
              disabled={isGenerating || !topicInput.trim()}
              className="w-full btn-radiant py-3 rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Generating Flashcards with AI...
                </>
              ) : (
                <>
                  <i className="fas fa-sparkles" />
                  Generate AI Flashcard Set
                </>
              )}
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              if (onSendToChat && currentCard) {
                onSendToChat(`Explain this study card in detail: "${currentCard.front}"`);
                onClose();
              }
            }}
            className="px-4 py-2 rounded-xl glass-button text-xs text-purple-300 hover:text-white flex items-center gap-2"
          >
            <i className="fas fa-paper-plane" /> Ask AI to Explain Current Card
          </button>
        </div>
      </div>
    </div>
  );
};