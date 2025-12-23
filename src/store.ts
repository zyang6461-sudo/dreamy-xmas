import { create } from 'zustand';

export type Mode = 'TREE' | 'EXPLODE';

type AppState = {
  entered: boolean;
  enter: () => void;

  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;

  gestureEnabled: boolean;
  toggleGesture: () => void;

  audioPlaying: boolean;
  setAudioPlaying: (v: boolean) => void;
  toggleAudio: () => void;
};

export const useStore = create<AppState>((set) => ({
  entered: false,
  enter: () => set({ entered: true }),

  mode: 'TREE',
  toggleMode: () => set((s) => ({ mode: s.mode === 'TREE' ? 'EXPLODE' : 'TREE' })),
  setMode: (mode) => set({ mode }),

  gestureEnabled: false,
  toggleGesture: () => set((s) => ({ gestureEnabled: !s.gestureEnabled })),

  audioPlaying: false,
  setAudioPlaying: (v) => set({ audioPlaying: v }),
  toggleAudio: () => set((s) => ({ audioPlaying: !s.audioPlaying })),
}));
