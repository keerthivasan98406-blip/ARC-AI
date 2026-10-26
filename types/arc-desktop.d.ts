/**
 * Global type augmentation for the Electron desktop integration.
 * Injected by the Electron preload script into window.__ARC_DESKTOP__
 * when running as the Arc AI Desktop App.
 */
declare global {
  interface Window {
    __ARC_DESKTOP__?: {
      version: string;
      openFloatingWindow: () => Promise<{ success: boolean; error?: string }>;
      closeFloatingWindow: () => Promise<{ success: boolean }>;
      isFloatingWindowOpen: () => Promise<boolean>;
    };
  }
}

export {};
