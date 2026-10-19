'use client';
import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getAppTheme } from '@/lib/theme';
import { ThemeContextProvider, useThemeMode } from '@/contexts/ThemeContext';

function InnerThemeRegistry({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  const theme = React.useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeContextProvider>
        <InnerThemeRegistry>{children}</InnerThemeRegistry>
      </ThemeContextProvider>
    </AppRouterCacheProvider>
  );
}
