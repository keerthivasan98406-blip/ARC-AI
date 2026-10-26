import React, { useState, useEffect, useRef } from 'react';
import { chatWithArcAi } from '../services/geminiService';

interface CodeVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export interface ExecutionStep {
  stepNumber: number;
  lineNumber: number;
  lineText: string;
  explanation: string;
  variables: Record<string, any>;
  activeNodeId: string;
}

export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'condition' | 'loop' | 'end';
}

export const PRESET_EXAMPLES = [
  {
    name: 'Fibonacci Sequence',
    language: 'python',
    code: `def fibonacci(n):\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result\n\nprint(fibonacci(5))`,
  },
  {
    name: 'Binary Search',
    language: 'javascript',
    code: `function binarySearch(arr, target) {\n  let low = 0, high = arr.length - 1;\n  while (low <= high) {\n    let mid = Math.floor((low + high) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}`,
  },
  {
    name: 'Array Reversal',
    language: 'javascript',
    code: `function reverseArray(arr) {\n  let left = 0, right = arr.length - 1;\n  while (left < right) {\n    let temp = arr[left];\n    arr[left] = arr[right];\n    arr[right] = temp;\n    left++; right--;\n  }\n  return arr;\n}`,
  },
];

export const CodeVisualizerModal: React.FC<CodeVisualizerModalProps> = ({
  isOpen,
  onClose,
  initialCode,
}) => {
  const [inputCode, setInputCode] = useState(initialCode || PRESET_EXAMPLES[0].code);
  const [language, setLanguage] = useState('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [overallExplanation, setOverallExplanation] = useState<string>('');
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const [formattedLines, setFormattedLines] = useState<string[]>([]);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (isPlaying) {
      const interval = 1800 / playbackSpeed;
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, steps.length, playbackSpeed]);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!inputCode.trim()) return;
    setIsAnalyzing(true);
    setIsPlaying(false);
    setCurrentStepIndex(0);

    const prompt = `Analyze this code and generate a line-by-line visual execution flow and flowchart structure.
Code snippet:
\`\`\`${language}
${inputCode}
\`\`\`

Return ONLY valid JSON with this exact schema (no additional markdown text):
{
  "explanation": "High-level summary of what this code accomplishes",
  "flowNodes": [
    { "id": "node1", "label": "Start Execution", "type": "start" },
    { "id": "node2", "label": "Initialize Variables", "type": "process" },
    { "id": "node3", "label": "Check Loop Condition", "type": "condition" },
    { "id": "node4", "label": "Update Array State", "type": "process" },
    { "id": "node5", "label": "Return Final Result", "type": "end" }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "lineNumber": 1,
      "lineText": "function binarySearch(arr, target) {",
      "explanation": "Function defined with input parameters",
      "variables": { "arr": "[1, 3, 5, 7, 9]", "target": "7" },
      "activeNodeId": "node1"
    },
    {
      "stepNumber": 2,
      "lineNumber": 2,
      "lineText": "let low = 0, high = arr.length - 1;",
      "explanation": "Initialize pointer indices low = 0 and high = 4",
      "variables": { "low": 0, "high": 4, "arr": "[1, 3, 5, 7, 9]" },
      "activeNodeId": "node2"
    }
  ]
}`;

    try {
      const result = await chatWithArcAi(prompt, [], () => {}, undefined, 'gpt-5');
      let cleanJson = result.text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanJson);
      setOverallExplanation(parsed.explanation || 'Code execution flow analyzed successfully.');
      setFlowNodes(parsed.flowNodes || []);
      setSteps(parsed.steps || []);
      setFormattedLines(inputCode.split('\n'));
      setCurrentStepIndex(0);
    } catch (e) {
      console.warn('AI analysis fallback:', e);
      const lines = inputCode.split('\n').filter((l) => l.trim().length > 0);
      setFormattedLines(inputCode.split('\n'));
      setOverallExplanation('Line-by-line visual execution mapping for the provided code.');

      const mockNodes: FlowNode[] = [
        { id: 'node1', label: 'Start Entry', type: 'start' },
        { id: 'node2', label: 'Process Logic', type: 'process' },
        { id: 'node3', label: 'Evaluate Condition', type: 'condition' },
        { id: 'node4', label: 'Return Output', type: 'end' },
      ];
      setFlowNodes(mockNodes);

      const mockSteps: ExecutionStep[] = lines.map((line, idx) => ({
        stepNumber: idx + 1,
        lineNumber: idx + 1,
        lineText: line,
        explanation: `Executing statement: ${line.trim()}`,
        variables: { step: idx + 1, status: 'Active' },
        activeNodeId: mockNodes[Math.min(idx, mockNodes.length - 1)].id,
      }));
      setSteps(mockSteps);
      setCurrentStepIndex(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeStep = steps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md modal-backdrop animate-fade-in-up duration-200">
      <div className="w-full max-w-6xl h-[92vh] glass-elevated rounded-3xl border border-cyan-500/30 p-5 flex flex-col justify-between shadow-2xl overflow-hidden relative animate-fade-in-scale">
        <div className="flex items-center justify-between pb-3 border-b border-white/12 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg animate-orb-pulse">
              <i className="fas fa-project-diagram text-lg text-cyan-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display tracking-tight flex items-center gap-2">
                Arc AI Visual Code Flow & Execution Simulator
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] uppercase font-mono tracking-wider">
                  Interactive AI Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Line-by-line step execution, real-time variable tracking & dynamic flowchart diagrams
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

        <div className="my-3 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter coding question or paste code... e.g. How does Fibonacci recursion work?"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 font-mono shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputCode.trim()}
                className="btn-radiant px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Synthesizing Execution Flow...
                  </>
                ) : (
                  <>
                    <i className="fas fa-play text-xs" />
                    Analyze & Visualize Flow
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 font-mono shrink-0 tracking-wide">Try Presets:</span>
            {PRESET_EXAMPLES.map((example) => (
              <button
                key={example.name}
                onClick={() => {
                  setInputCode(example.code);
                  setLanguage(example.language);
                }}
                className="px-2.5 py-1 rounded-lg glass-button text-cyan-300 hover:text-white transition-all duration-300 shrink-0 flex items-center gap-1.5 text-[11px]"
              >
                <i className="fas fa-code text-[10px]" />
                {example.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-0">
          <div className="flex flex-col h-full space-y-3 overflow-hidden">
            <div className="flex-1 glass-card rounded-2xl border border-white/15 p-3 overflow-y-auto font-mono text-xs bg-slate-950/90 shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/12 text-[11px] text-slate-400">
                <span>Execution Viewpoint (Line-by-Line)</span>
                {activeStep && (
                  <span className="text-cyan-400 font-bold">
                    Line {activeStep.lineNumber} of {formattedLines.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {formattedLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isActive = activeStep && activeStep.lineNumber === lineNum;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start px-2 py-1 rounded transition-all duration-300 ${
                        isActive
                          ? 'bg-cyan-500/25 border-l-4 border-cyan-400 text-white font-bold shadow-[0_0_18px_rgba(6,182,212,0.2)]'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="w-8 shrink-0 text-slate-600 text-right pr-3 select-none font-mono">
                        {lineNum}
                      </span>
                      <pre className="whitespace-pre overflow-x-auto flex-1 font-mono">
                        <code>{line || ' '}</code>
                      </pre>
                      {isActive && (
                        <span className="shrink-0 text-[10px] text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-400/40 ml-2 animate-pulse">
                          Pointer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-cyan-500/30 p-3 bg-slate-900/80 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 font-display flex items-center gap-1.5 tracking-tight">
                  <i className="fas fa-microchip text-cyan-400" />
                  Step {currentStepIndex + 1} Explanation:
                </span>
                {steps.length > 0 && (
                  <span className="text-[11px] font-mono text-slate-400 tracking-wide">
                    Step {currentStepIndex + 1} of {steps.length}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {activeStep ? activeStep.explanation : overallExplanation || 'Click "Analyze & Visualize Flow" to start execution step simulation.'}
              </p>

              {activeStep?.variables && (
                <div className="pt-2 border-t border-white/12">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 font-mono block mb-1">
                    Variable State Inspector:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(activeStep.variables).map(([k, v]) => (
                      <div
                        key={k}
                        className="px-2.5 py-1 rounded-lg bg-purple-950/50 border border-purple-500/40 text-[11px] font-mono text-white flex items-center gap-1.5 shadow"
                      >
                        <span className="text-purple-300 font-bold">{k}:</span>
                        <span className="text-cyan-300">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col h-full space-y-3 overflow-hidden">
            <div className="flex-1 glass-card rounded-2xl border border-white/15 p-4 flex flex-col justify-between overflow-y-auto bg-slate-950/70 relative">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/12">
                <span className="font-bold text-white font-display flex items-center gap-1.5 tracking-tight">
                  <i className="fas fa-sitemap text-purple-400" />
                  Interactive Execution Flowchart Graph
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Live Node Highlighting
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-3">
                {flowNodes.length === 0 ? (
                  <div className="text-center text-slate-500 space-y-2">
                    <i className="fas fa-project-diagram text-4xl text-slate-700" />
                    <p className="text-xs">No flowchart generated yet.</p>
                  </div>
                ) : (
                  flowNodes.map((node, nIdx) => {
                    const isActiveNode = activeStep && activeStep.activeNodeId === node.id;
                    return (
                      <React.Fragment key={node.id}>
                        {nIdx > 0 && (
                          <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-500 to-purple-500 relative flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          </div>
                        )}

                        <div
                          className={`w-full max-w-md p-3 rounded-xl border text-center transition-all duration-300 ${
                            isActiveNode
                              ? 'bg-gradient-to-r from-cyan-500/30 via-purple-600/30 to-blue-600/30 border-cyan-400 text-white shadow-[0_0_28px_rgba(6,182,212,0.4)] scale-105 font-bold'
                              : 'bg-slate-900/60 border-white/10 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300 tracking-wider">
                              {node.type}
                            </span>
                            <span className="text-xs font-semibold">{node.label}</span>
                            {isActiveNode && (
                              <i className="fas fa-check-circle text-emerald-400 text-xs animate-bounce" />
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/15 p-3 bg-slate-900/90 flex flex-col space-y-2 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 shrink-0 tracking-wide">
                  {currentStepIndex + 1} / {steps.length || 1}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, steps.length - 1)}
                  value={currentStepIndex}
                  onChange={(e) => {
                    setCurrentStepIndex(Number(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {[0.5, 1, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors duration-300 ${
                        playbackSpeed === spd
                          ? 'bg-cyan-500 text-slate-950'
                          : 'glass-button text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentStepIndex(0);
                      setIsPlaying(false);
                    }}
                    className="w-8 h-8 rounded-xl glass-button text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors duration-300"
                    title="Reset to Start"
                  >
                    <i className="fas fa-undo" />
                  </button>

                  <button
                    onClick={() => {
                      setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                      setIsPlaying(false);
                    }}
                    disabled={currentStepIndex === 0}
                    className="w-8 h-8 rounded-xl glass-button text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors duration-300 disabled:opacity-40"
                    title="Previous Step"
                  >
                    <i className="fas fa-step-backward" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={steps.length === 0}
                    className="w-10 h-10 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center text-sm shadow-lg transition-transform duration-200 active:scale-95 disabled:opacity-50"
                  >
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
                  </button>

                  <button
                    onClick={() => {
                      setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                      setIsPlaying(false);
                    }}
                    disabled={currentStepIndex >= steps.length - 1}
                    className="w-8 h-8 rounded-xl glass-button text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors duration-300 disabled:opacity-40"
                    title="Next Step"
                  >
                    <i className="fas fa-step-forward" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
