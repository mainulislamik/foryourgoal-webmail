'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type DensityMode = 'default' | 'comfortable' | 'compact';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  density: DensityMode;
  setDensity: (d: DensityMode) => void;
  signature: string;
  setSignature: (s: string, email?: string) => void;
  keyboardShortcutsEnabled: boolean;
  setKeyboardShortcutsEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  density: 'default',
  setDensity: () => {},
  signature: '',
  setSignature: () => {},
  keyboardShortcutsEnabled: true,
  setKeyboardShortcutsEnabled: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);
export const useThemeMode = useAppTheme;

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [density, setDensityState] = useState<DensityMode>('default');
  const [signature, setSignatureState] = useState<string>('');
  const [keyboardShortcutsEnabled, setShortcutsState] = useState<boolean>(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('fyg_webmail_theme') as ThemeMode;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setMode(savedTheme);
    }
    const savedDensity = localStorage.getItem('fyg_webmail_density') as DensityMode;
    if (savedDensity) {
      setDensityState(savedDensity);
    }

    // Synchronize signature with backend profile for currently authenticated user
    fetch('/api/profile/signature')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.signature === 'string' && data.signature.trim()) {
          setSignatureState(data.signature);
          if (data.email) {
            localStorage.setItem(`fyg_webmail_signature_${data.email}`, data.signature);
          }
        }
      })
      .catch(() => {});
    const savedShortcuts = localStorage.getItem('fyg_webmail_shortcuts');
    if (savedShortcuts !== null) {
      setShortcutsState(savedShortcuts === 'true');
    }
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('fyg_webmail_theme', next);
      return next;
    });
  };

  const setDensity = (d: DensityMode) => {
    setDensityState(d);
    localStorage.setItem('fyg_webmail_density', d);
  };

  const setSignature = (s: string, email?: string) => {
    setSignatureState(s);
    if (email) {
      localStorage.setItem(`fyg_webmail_signature_${email}`, s);
    }
    localStorage.setItem('fyg_webmail_signature', s);
    // Persist to server API
    fetch('/api/profile/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature: s }),
    }).catch((err) => console.error('Failed to sync signature to server:', err));
  };

  const setKeyboardShortcutsEnabled = (enabled: boolean) => {
    setShortcutsState(enabled);
    localStorage.setItem('fyg_webmail_shortcuts', String(enabled));
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleTheme,
        density,
        setDensity,
        signature,
        setSignature,
        keyboardShortcutsEnabled,
        setKeyboardShortcutsEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
