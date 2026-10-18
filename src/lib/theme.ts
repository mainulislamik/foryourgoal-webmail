'use client';
import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#a8c7fa' : '#0b57d0', // Google Light Blue on dark, Google Blue on light
        light: isDark ? '#004a77' : '#c2e7ff', // Pill active background
        dark: isDark ? '#d3e3fd' : '#041e49',
        contrastText: isDark ? '#041e49' : '#ffffff',
      },
      secondary: {
        main: isDark ? '#c4c7c5' : '#1f1f1f',
      },
      background: {
        default: isDark ? '#1e1f20' : '#f6f8fc', // Google Workspace dark / light canvas
        paper: isDark ? '#282a2c' : '#ffffff',   // Cards, inbox container, reader surface
      },
      text: {
        primary: isDark ? '#e3e3e3' : '#1f1f1f',
        secondary: isDark ? '#c4c7c5' : '#444746',
      },
      divider: isDark ? '#3c4043' : '#e0e2ec',
    },
    typography: {
      fontFamily: [
        'Google Sans',
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Arial',
        'sans-serif',
      ].join(','),
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            padding: '8px 24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};
