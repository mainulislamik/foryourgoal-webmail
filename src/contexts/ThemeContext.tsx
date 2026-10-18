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
  setSignature: (s: string) => void;
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
    const savedSig = localStorage.getItem('fyg_webmail_signature');
    if (savedSig !== null) {
      setSignatureState(savedSig);
    } else {
      // Default signature
      setSignatureState('--\nBest Regards,\nImon Khan\nForYourGoal | IT Systems & Infrastructure\nhttps://foryourgoal.com');
    }
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

  const setSignature = (s: string) => {
    setSignatureState(s);
    localStorage.setItem('fyg_webmail_signature', s);
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
