import React, { useEffect, useMemo, useState } from 'react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** True when a native `beforeinstallprompt` event is available right now. */
  canNativeInstall: boolean;
  /** Ask the browser to show its own install sheet again (if still possible). */
  onTryNativeInstall: () => void;
  isInstalled: boolean;
}

type Platform = 'ios' | 'android' | 'desktop' | 'other';

const detectPlatform = (): Platform => {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  const isiOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1);
  if (isiOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux/i.test(ua)) return 'desktop';
  return 'other';
};

interface Step {
  icon: string;
  text: string;
}

const STEPS: Record<Platform, Step[]> = {
  ios: [
    { icon: 'fa-arrow-up-from-bracket', text: 'Tap the Share button in Safari (bottom toolbar).' },
    { icon: 'fa-square-plus', text: 'Choose "Add to Home Screen" from the share menu.' },
    { icon: 'fa-circle-check', text: 'Tap "Add" — Arc AI will appear on your home screen.' },
  ],
  android: [
    { icon: 'fa-ellipsis-vertical', text: 'Tap the three-dot menu in Chrome (top right).' },
    { icon: 'fa-download', text: 'Select "Install app" or "Add to Home screen".' },
    { icon: 'fa-circle-check', text: 'Confirm the install — Arc AI opens in full screen.' },
  ],
  desktop: [
    { icon: 'fa-window-restore', text: 'Look for the install icon at the right of the address bar.' },
    { icon: 'fa-download', text: 'Click "Install Arc AI" in the popup (or Menu → Install app).' },
    { icon: 'fa-circle-check', text: 'Launch Arc AI from your Start Menu, Dock or desktop shortcut.' },
  ],
  other: [
    { icon: 'fa-bars', text: 'Open your browser menu and look for "Install app" / "Add to Home Screen".' },
    { icon: 'fa-circle-check', text: 'Confirm the install to keep Arc AI on your device.' },
  ],
};

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  canNativeInstall,
  onTryNativeInstall,
  isInstalled,
}) => {
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    if (isOpen) setPlatform(detectPlatform());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const steps = useMemo(() => STEPS[platform] ?? STEPS.other, [platform]);
  const platformLabel =
    platform === 'ios' ? 'iPhone / iPad' : platform === 'android' ? 'Android' : platform === 'desktop' ? 'Desktop' : 'Device';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Install Arc AI"
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-cyan-500/30 bg-[#0d1117]/95 backdrop-blur-xl shadow-2xl shadow-cyan-900/30 p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <i className="fas fa-times text-[10px] text-slate-400" />
        </button>

        <div className="relative flex flex-col items-center text-center">
          {/* App icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#000005] border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-500/20 overflow-hidden mb-4">
            <img src="/icons/icon-192.png" alt="Arc AI" className="w-14 h-14 object-contain" />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono mb-1">
            {isInstalled ? 'Installed' : 'Install Arc AI'}
          </p>
          <h3 className="text-lg font-bold text-white mb-1 leading-snug">
            {isInstalled ? 'Arc AI is on your device' : 'Get Arc AI on your device'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-5">
            {isInstalled
              ? 'Launch Arc AI from your home screen, Start Menu or app drawer — it runs in its own window, no browser UI.'
              : `Follow these steps on ${platformLabel} to keep Arc AI installed.`}
          </p>

          {/* Steps */}
          <div className="w-full space-y-2 mb-5">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-left px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shrink-0">
                  <i className={`fas ${step.icon} text-[10px]`} />
                </div>
                <span className="text-[11px] text-slate-300 leading-snug">{step.text}</span>
              </div>
            ))}
          </div>

          {/* Primary action */}
          {canNativeInstall && !isInstalled ? (
            <button
              onClick={onTryNativeInstall}
              className="w-full btn-radiant py-2.5 rounded-2xl text-xs font-bold text-white cursor-pointer"
            >
              <i className="fas fa-download text-xs mr-1.5" />
              Install with browser prompt
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl text-xs font-bold text-cyan-200 cursor-pointer transition-all duration-300 hover:text-white"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(6,182,212,0.35)' }}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
