import React, { useState } from 'react';
import { ImageStudioPreset } from '../types';
import { generateImageWithArcAi } from '../services/geminiService';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendImageToChat?: (imageUrl: string, prompt: string) => void;
}

export const STYLE_PRESETS: ImageStudioPreset[] = [
  {
    id: 'photorealistic',
    name: 'Photorealistic 8K',
    promptModifier: 'cinematic lighting, ultra hyperrealistic 8K resolution, octane render, master shot',
    previewGradient: 'from-blue-600 via-indigo-600 to-slate-900',
    icon: 'fa-camera-retro',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    promptModifier: 'futuristic cyberpunk city, vibrant neon glows, holographic reflections, deep space dark mode aesthetic',
    previewGradient: 'from-cyan-500 via-purple-600 to-pink-600',
    icon: 'fa-city',
  },
  {
    id: '3d-render',
    name: '3D Glass render',
    promptModifier: 'subtle glassmorphism, frosted translucent materials, ambient occlusion, smooth raytracing studio light',
    previewGradient: 'from-purple-500 via-cyan-400 to-indigo-700',
    icon: 'fa-cube',
  },
  {
    id: 'anime',
    name: 'Anime Masterpiece',
    promptModifier: 'vibrant anime aesthetic, Makoto Shinkai style, vivid sky, highly detailed line art',
    previewGradient: 'from-[#FFFFFF] via-[#C0C0C0] to-[#8A8A8A]',
    icon: 'fa-paint-brush',
  },
  {
    id: 'ui-mockup',
    name: 'UI / UX Dashboard',
    promptModifier: 'state of the art futuristic web dashboard interface, sleek dark mode, radiant glowing graphs and charts',
    previewGradient: 'from-slate-900 via-blue-900 to-cyan-500',
    icon: 'fa-desktop',
  },
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onSendImageToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [selectedPreset, setSelectedPreset] = useState<string>('cyberpunk');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedImageUrl(null);

    const presetInfo = STYLE_PRESETS.find((p) => p.id === selectedPreset) || STYLE_PRESETS[0];
    const fullPrompt = `${prompt.trim()}, ${presetInfo.promptModifier}`;

    let width = 1024;
    let height = 1024;
    if (selectedRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (selectedRatio === '9:16') {
      width = 720;
      height = 1280;
    }

    try {
      const url = await generateImageWithArcAi(fullPrompt, width, height, 'flux');
      if (url) {
        setGeneratedImageUrl(url);
      } else {
        throw new Error('Failed to generate image URL');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to synthesize AI artwork. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop animate-fade-in-up duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] glass-elevated rounded-3xl border border-cyan-500/30 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto relative animate-fade-in-scale">
        <div className="flex items-center justify-between pb-4 border-b border-white/12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg animate-orb-pulse">
              <i className="fas fa-palette text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display tracking-tight">
                Arc AI Image Generation Studio
              </h2>
              <p className="text-xs text-slate-400">
                Transform natural text prompts into state-of-the-art visual artwork
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white font-display block mb-1.5 tracking-tight">
                Art Prompt & Vision Concept
              </label>
              <textarea
                rows={3}
                placeholder="Describe your visual concept... e.g. Futuristic glassmorphic AI portal with cyan glowing rings and neon cosmic aurora"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full glass-textarea rounded-xl p-3 text-xs text-white placeholder:text-slate-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white font-display block mb-1.5 tracking-tight">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { ratio: '1:1', label: '1:1 Square', icon: 'fa-square' },
                  { ratio: '16:9', label: '16:9 Landscape', icon: 'fa-rectangle-wide' },
                  { ratio: '9:16', label: '9:16 Portrait', icon: 'fa-mobile-alt' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.ratio}
                    onClick={() => setSelectedRatio(item.ratio as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                      selectedRatio === item.ratio
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                        : 'glass-button text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className={`fas ${item.icon} text-xs`} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-white font-display block mb-1.5 tracking-tight">
                Aesthetic Style Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all duration-300 ${
                      selectedPreset === preset.id
                        ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                        : 'glass-button text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${preset.previewGradient} flex items-center justify-center text-white text-[10px]`}>
                      <i className={`fas ${preset.icon}`} />
                    </div>
                    <span className="text-[11px] font-bold truncate tracking-tight">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full btn-radiant py-3 rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin text-sm" />
                  Synthesizing Neural Art Canvas...
                </>
              ) : (
                <>
                  <i className="fas fa-wand-magic-sparkles text-sm" />
                  Generate High-Res Artwork
                </>
              )}
            </button>
          </form>

          <div className="glass-card rounded-2xl border border-white/15 p-4 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden bg-slate-950/60">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 animate-spin flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center">
                    <i className="fas fa-sparkles text-cyan-400 text-xl" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-cyan-300 font-display tracking-tight">
                  Rendering 8K Glassmorphic Texture...
                </span>
              </div>
            ) : generatedImageUrl ? (
              <div className="w-full h-full flex flex-col items-center gap-3">
                <img
                  src={generatedImageUrl}
                  alt="Generated AI Studio Art"
                  className="w-full h-auto max-h-[260px] object-cover rounded-xl border border-cyan-500/30 shadow-2xl"
                />
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={(e) => handleGenerate(e)}
                    className="px-3 py-2 rounded-xl glass-button text-purple-300 border border-purple-500/40 font-bold text-xs shadow-md transition-colors duration-300 flex items-center justify-center gap-1.5"
                    title="Regenerate artwork with a new seed"
                  >
                    <i className="fas fa-sync-alt text-xs" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onSendImageToChat && generatedImageUrl) {
                        onSendImageToChat(generatedImageUrl, prompt);
                        onClose();
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors duration-300 flex items-center justify-center gap-1.5"
                  >
                    <i className="fas fa-paper-plane text-xs" />
                    Attach & Send to Chat
                  </button>
                  <a
                    href={generatedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download="arc_ai_studio_art.jpg"
                    className="px-3 py-2 rounded-xl glass-button text-white font-semibold text-xs transition-colors duration-300 flex items-center justify-center gap-1.5"
                    title="Download High-Res Image"
                  >
                    <i className="fas fa-download" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 text-slate-400">
                <i className="fas fa-image text-3xl text-slate-600 mb-1" />
                <p className="text-xs font-semibold">No Image Generated Yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Enter a prompt above and select your aesthetic preset to create custom AI imagery.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
