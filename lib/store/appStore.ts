import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  xp: number;
  setXp: (xp: number) => void;
  streak: number;
  setStreak: (streak: number) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  toast: { id: number; type: 'success' | 'error' | 'info'; title: string; message: string } | null;
  showToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message: string }) => void;
  dismissToast: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      xp: 320,
      setXp: (xp) => set({ xp }),
      streak: 7,
      setStreak: (streak) => set({ streak }),
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toast: null,
      showToast: (toast) => set({ toast: { ...toast, id: Date.now() } }),
      dismissToast: () => set({ toast: null }),
    }),
    {
      name: 'trainarduino-store',
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        xp: state.xp,
        streak: state.streak,
      }),
    }
  )
);
