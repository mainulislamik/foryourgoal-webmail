'use client';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0b57d0', // Google Blue
      light: '#d3e3fd',
      dark: '#041e49',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1f1f1f',
    },
    background: {
      default: '#f6f8fc', // Google Workspace light background
      paper: '#ffffff',
    },
    text: {
      primary: '#1f1f1f',
      secondary: '#444746',
    },
    divider: '#e0e2ec',
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
