'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '@/contexts/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: isDark ? '#0b0f19' : '#f8fafc',
        backgroundImage: isDark
          ? 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 70%)',
        p: { xs: 2, sm: 3 },
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Bar with Theme Toggle */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconButton
          onClick={toggleTheme}
          sx={{
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            p: 1,
            color: isDark ? '#94a3b8' : '#64748b',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              color: isDark ? '#f8fafc' : '#0f172a',
            },
          }}
          title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        >
          {isDark ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Main Login Card */}
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: '20px',
          bgcolor: isDark ? '#111827' : '#ffffff',
          border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
          boxShadow: isDark
            ? '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
            : '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Accent Top Border */}
        <Box
          sx={{
            height: 4,
            width: '100%',
            background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
          }}
        />

        <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          {/* Brand Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
            <Box
              component="img"
              src={isDark ? '/brand/for-your-goal-header-dark-background.svg' : '/brand/for-your-goal-header-light-background.svg'}
              alt="ForYourGoal"
              sx={{
                height: 40,
                width: 'auto',
                mb: 2,
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: isDark ? '#f8fafc' : '#0f172a',
                  letterSpacing: '-0.02em',
                }}
              >
                Sign in to Webmail
              </Typography>
              <Chip
                label="MAIL"
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  height: 22,
                  bgcolor: isDark ? 'rgba(37,99,235,0.2)' : 'rgba(37,99,235,0.1)',
                  color: '#2563eb',
                  border: '1px solid rgba(37,99,235,0.25)',
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                textAlign: 'center',
                fontSize: '0.88rem',
              }}
            >
              Enter your credentials to access your secure mailbox
            </Typography>
          </Box>

          {/* Error Message */}
          {errorMsg && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '12px',
                fontSize: '0.85rem',
                border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca',
                bgcolor: isDark ? 'rgba(127,29,29,0.2)' : '#fef2f2',
                color: isDark ? '#fca5a5' : '#991b1b',
              }}
            >
              {errorMsg}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                component="label"
                htmlFor="email"
                sx={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isDark ? '#e2e8f0' : '#334155',
                  mb: 0.8,
                }}
              >
                Email Address
              </Typography>
              <TextField
                id="email"
                name="email"
                type="email"
                fullWidth
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: isDark ? '#1f2937' : '#f8fafc',
                    '& fieldset': {
                      borderColor: isDark ? '#374151' : '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: isDark ? '#4b5563' : '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563eb',
                      borderWidth: '1.5px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.92rem',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    py: 1.4,
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 3.5 }}>
              <Typography
                component="label"
                htmlFor="password"
                sx={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isDark ? '#e2e8f0' : '#334155',
                  mb: 0.8,
                }}
              >
                Password
              </Typography>
              <TextField
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                autoComplete="current-password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: isDark ? '#1f2937' : '#f8fafc',
                    '& fieldset': {
                      borderColor: isDark ? '#374151' : '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: isDark ? '#4b5563' : '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563eb',
                      borderWidth: '1.5px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.92rem',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    py: 1.4,
                  },
                }}
              />
            </Box>

            {/* Sign In Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <LoginIcon sx={{ fontSize: 20 }} />
                )
              }
              sx={{
                py: 1.4,
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#2563eb',
                backgroundImage: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  backgroundImage: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 6px 16px rgba(37,99,235,0.4)',
                },
                '&.Mui-disabled': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
                  color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)',
                },
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Security Info & Copyright Footer */}
      <Box
        sx={{
          mt: 3.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.2,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.8,
            px: 1.5,
            py: 0.5,
            borderRadius: '20px',
            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <ShieldOutlinedIcon sx={{ fontSize: 15, color: '#10b981' }} />
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 500,
            }}
          >
            TLS 1.3 Encrypted • Enterprise IMAP &amp; SMTP Gateway
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: '0.75rem',
            color: isDark ? '#64748b' : '#94a3b8',
          }}
        >
          &copy; {new Date().getFullYear()} ForYourGoal. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
