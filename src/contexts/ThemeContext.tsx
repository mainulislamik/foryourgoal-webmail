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
    }

    // Synchronize signature with backend profile
    fetch('/api/profile/signature')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.signature === 'string' && data.signature.trim()) {
          setSignatureState(data.signature);
          localStorage.setItem('fyg_webmail_signature', data.signature);
        } else if (savedSig === null) {
          // If neither server nor local has a signature, set default placeholder
          const defaultSig = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #1e293b; line-height: 1.5;">
  <p style="margin: 0 0 8px 0; color: #64748b;">--<br>Best Regards,</p>
  <table cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; font-family: Arial, sans-serif;">
    <tr>
      <td style="vertical-align: top; padding-right: 18px; border-right: 2px solid #0284c7;">
        <img src="https://foryourgoal.com/images/foryourgoal-logo.png" alt="ForYourGoal Logo" width="125" style="display: block; width: 125px; height: auto;" />
      </td>
      <td style="vertical-align: top; padding-left: 18px;">
        <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 2px;">Imon Khan</div>
        <div style="font-size: 13px; font-weight: 600; color: #0284c7; margin-bottom: 6px;">IT Specialist &amp; Infrastructure Head</div>
        <div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>ForYourGoal</strong> &bull; Creative Post-Production &amp; Tech</div>
        <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
          📞 <strong>Phone:</strong> <a href="tel:+8801613511887" style="color: #0284c7; text-decoration: none;">+880 1613-511887</a><br>
          🌐 <strong>Web:</strong> <a href="https://foryourgoal.com" target="_blank" style="color: #0284c7; text-decoration: none;">foryourgoal.com</a><br>
          ✉️ <strong>Email:</strong> <a href="mailto:imon.khan@foryourgoal.com" style="color: #0284c7; text-decoration: none;">imon.khan@foryourgoal.com</a>
        </div>
      </td>
    </tr>
  </table>
</div>`;
          setSignatureState(defaultSig);
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

  const setSignature = (s: string) => {
    setSignatureState(s);
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
