import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User { id:number; username:string; name:string; email:string; role:string; dependencia?:string; }
interface Toast { id:string; type:'success'|'error'|'warning'|'info'; title:string; message?:string; }

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  // App settings
  fiscalYear: number;
  setFiscalYear: (y: number) => void;
  period: number | null;
  setPeriod: (p: number | null) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  // Toasts
  toasts: Toast[];
  addToast: (t: Omit<Toast,'id'>) => void;
  removeToast: (id: string) => void;
  // Cache
  fiscalYears: any[];
  setFiscalYears: (fy: any[]) => void;
  accounts: any[];
  setAccounts: (a: any[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null, token: null,
      setAuth: (user, token) => { localStorage.setItem('scg_token', token); set({ user, token }); },
      clearAuth: () => { localStorage.removeItem('scg_token'); set({ user: null, token: null }); },
      fiscalYear: 2025, setFiscalYear: (y) => set({ fiscalYear: y }),
      period: null, setPeriod: (p) => set({ period: p }),
      darkMode: false, toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
      sidebarCollapsed: false, toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toasts: [],
      addToast: (t) => {
        const id = Math.random().toString(36).slice(2);
        set(s => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
      fiscalYears: [], setFiscalYears: (fy) => set({ fiscalYears: fy }),
      accounts: [], setAccounts: (a) => set({ accounts: a }),
    }),
    { name: 'scg-store', partialize: (s) => ({ token: s.token, user: s.user, fiscalYear: s.fiscalYear, darkMode: s.darkMode, sidebarCollapsed: s.sidebarCollapsed }) }
  )
);

export const useToast = () => {
  const { addToast } = useStore();
  return {
    toast: addToast,
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
  };
};
