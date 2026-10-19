'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Link,
  useTheme,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

// Official ForYourGoal Brand Logo
function OfficialBrandLogo({ isDark }: { isDark: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        component="img"
        src={isDark ? '/brand/for-your-goal-header-dark-background.svg' : '/brand/for-your-goal-header-light-background.svg'}
        alt="ForYourGoal"
        sx={{ height: { xs: 34, md: 40 }, width: 'auto' }}
      />
      <Box
        component="span"
        sx={{
          fontSize: '0.85rem',
          fontWeight: 700,
          px: 1,
          py: 0.3,
          borderRadius: 1,
          bgcolor: isDark ? 'rgba(36,123,255,0.2)' : 'rgba(36,123,255,0.1)',
          color: '#247BFF',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        Mail
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [email, setEmail] = useState('imon.khan@foryourgoal.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
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
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#131314' : '#f0f4f9',
        p: { xs: 2, sm: 3, md: 4 },
        boxSizing: 'border-box',
      }}
    >
      {/* Main Google-Style M3 Container Card */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: { xs: 440, md: 920 },
          minHeight: { md: 460 },
          borderRadius: '28px',
          backgroundColor: isDark ? '#1e1f20' : '#ffffff',
          border: isDark ? '1px solid #3c4043' : '1px solid #e0e2ec',
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          p: { xs: 3.5, sm: 4.5, md: 6 },
          gap: { xs: 3, md: 6 },
          boxSizing: 'border-box',
        }}
      >
        {/* Left Section: Branding & Titles */}
        <Box
          sx={{
            flex: { md: 1 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ mb: { xs: 2.5, md: 3.5 } }}>
            <OfficialBrandLogo isDark={isDark} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Google Sans', 'Roboto', sans-serif",
              fontWeight: 400,
              fontSize: { xs: '1.75rem', sm: '2.1rem', md: '2.25rem' },
              color: isDark ? '#e3e3e3' : '#1f1f1f',
              letterSpacing: '-0.5px',
              mb: 1.5,
            }}
          >
            Sign in
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: isDark ? '#c4c7c5' : '#444746',
              fontSize: '1rem',
              lineHeight: 1.5,
              mb: 2,
            }}
          >
            to continue to ForYourGoal Mail
          </Typography>

          <Box
            sx={{
              mt: 'auto',
              display: { xs: 'none', md: 'block' },
              pt: 4,
            }}
          >
            <Typography variant="body2" sx={{ color: isDark ? '#8e918f' : '#747775', fontSize: '0.82rem' }}>
              Enterprise Webmail powered by ForYourGoal
            </Typography>
          </Box>
        </Box>

        {/* Right Section: Form Fields & Actions */}
        <Box
          sx={{
            flex: { md: 1.2 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {errorMsg && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '12px',
                fontSize: '0.9rem',
                border: isDark ? '1px solid #8c1d18' : '1px solid #f9dedc',
              }}
            >
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            {/* Email Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="email-input"
                name="email"
                label="Email or phone"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    color: isDark ? '#c4c7c5' : '#444746',
                    '&.Mui-focused': { color: isDark ? '#a8c7fa' : '#0b57d0' },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: isDark ? '#1e1f20' : '#ffffff',
                    '& fieldset': {
                      borderColor: isDark ? '#444746' : '#747775',
                    },
                    '&:hover fieldset': {
                      borderColor: isDark ? '#e3e3e3' : '#1f1f1f',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: isDark ? '#a8c7fa' : '#0b57d0',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: isDark ? '#e3e3e3' : '#1f1f1f',
                    padding: '16px 14px',
                    fontSize: '1rem',
                  },
                }}
              />
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  underline="none"
                  sx={{
                    color: isDark ? '#a8c7fa' : '#0b57d0',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                  onClick={() => setEmail('imon.khan@foryourgoal.com')}
                >
                  Forgot email?
                </Link>
              </Box>
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="password-input"
                name="password"
                label="Enter your password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    color: isDark ? '#c4c7c5' : '#444746',
                    '&.Mui-focused': { color: isDark ? '#a8c7fa' : '#0b57d0' },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: isDark ? '#c4c7c5' : '#747775' }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: isDark ? '#1e1f20' : '#ffffff',
                    '& fieldset': {
                      borderColor: isDark ? '#444746' : '#747775',
                    },
                    '&:hover fieldset': {
                      borderColor: isDark ? '#e3e3e3' : '#1f1f1f',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: isDark ? '#a8c7fa' : '#0b57d0',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: isDark ? '#e3e3e3' : '#1f1f1f',
                    padding: '16px 14px',
                    fontSize: '1rem',
                  },
                }}
              />
            </Box>

            {/* Guest Mode Informational Text */}
            <Typography
              variant="body2"
              sx={{
                color: isDark ? '#8e918f' : '#5f6368',
                fontSize: '0.875rem',
                lineHeight: 1.45,
                mb: 4,
              }}
            >
              Not your computer? Use Guest mode to sign in privately.{' '}
              <Link
                href="#"
                underline="none"
                sx={{
                  color: isDark ? '#a8c7fa' : '#0b57d0',
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Learn more about using Guest mode
              </Link>
            </Typography>

            {/* Actions: Create account & Next */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pt: 1,
              }}
            >
              <Button
                type="button"
                variant="text"
                sx={{
                  color: isDark ? '#a8c7fa' : '#0b57d0',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  px: 1.5,
                  borderRadius: '20px',
                  '&:hover': {
                    backgroundColor: isDark ? 'rgba(168,199,250,0.08)' : 'rgba(11,87,208,0.06)',
                  },
                }}
              >
                Create account
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  borderRadius: '24px',
                  px: 3.8,
                  py: 1.15,
                  minWidth: 100,
                  backgroundColor: isDark ? '#a8c7fa' : '#0b57d0',
                  color: isDark ? '#062e6f' : '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: isDark ? '#8ab4f8' : '#0842a0',
                    boxShadow: 'none',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: isDark ? '#062e6f' : '#ffffff' }} />
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Google-Style Footer */}
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: 440, md: 920 },
          mt: 2.5,
          px: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          boxSizing: 'border-box',
        }}
      >
        {/* Language selector button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            cursor: 'pointer',
            p: '6px 12px',
            borderRadius: '16px',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
          }}
        >
          <LanguageOutlinedIcon sx={{ fontSize: 18, color: isDark ? '#8e918f' : '#5f6368' }} />
          <Typography sx={{ fontSize: '0.8rem', color: isDark ? '#c4c7c5' : '#444746', fontWeight: 500 }}>
            English (United States)
          </Typography>
          <ArrowDropDownIcon sx={{ fontSize: 18, color: isDark ? '#8e918f' : '#5f6368' }} />
        </Box>

        {/* Footer links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5 }}>
          {['Help', 'Privacy', 'Terms'].map((link) => (
            <Link
              key={link}
              href="#"
              underline="none"
              sx={{
                fontSize: '0.78rem',
                color: isDark ? '#8e918f' : '#5f6368',
                '&:hover': { color: isDark ? '#e3e3e3' : '#1f1f1f' },
              }}
            >
              {link}
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
