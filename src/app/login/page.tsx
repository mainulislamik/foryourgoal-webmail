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
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('imon.khan@foryourgoal.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
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
        throw new Error(data.error || 'Authentication failed');
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f4f9',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: 5,
          borderRadius: '28px',
          backgroundColor: '#ffffff',
          border: '1px solid #e0e2ec',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Brand Icon */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '14px',
            backgroundColor: '#0b57d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            mb: 2,
            boxShadow: '0 2px 6px rgba(11, 87, 208, 0.3)',
          }}
        >
          <MarkEmailReadOutlinedIcon sx={{ fontSize: 32 }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f1f1f', mb: 1 }}>
          Sign in
        </Typography>
        <Typography variant="body2" sx={{ color: '#5f6368', mb: 3, textAlign: 'center' }}>
          to continue to ForYourGoal Mail
        </Typography>

        {errorMsg && (
          <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: '12px' }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label="Email or username"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: '#5f6368' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                borderRadius: '24px',
                px: 4,
                py: 1.2,
                backgroundColor: '#0b57d0',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.95rem',
                '&:hover': {
                  backgroundColor: '#0842a0',
                },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Next'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
