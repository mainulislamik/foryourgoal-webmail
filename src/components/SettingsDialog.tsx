'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SecurityIcon from '@mui/icons-material/Security';
import BrushIcon from '@mui/icons-material/Brush';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useThemeMode, DensityMode, ThemeMode } from '@/contexts/ThemeContext';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
  onAvatarUpdated: (newUrl: string) => void;
}

export default function SettingsDialog({
  open,
  onClose,
  user,
  onAvatarUpdated,
}: SettingsDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { mode, toggleTheme, density, setDensity, signature, setSignature } = useThemeMode();

  const [activeTab, setActiveTab] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [signatureText, setSignatureText] = useState(
    signature || `<b>${user.displayName}</b><br>IT Specialist | ForYourGoal<br><a href="https://foryourgoal.com">foryourgoal.com</a>`
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');

      onAvatarUpdated(data.avatarUrl);
      setSuccessMsg('Avatar updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSignature = () => {
    setSignature(signatureText);
    setSuccessMsg('Signature updated successfully!');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          p: 1,
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Settings
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab icon={<AccountCircleIcon fontSize="small" />} iconPosition="start" label="General & Avatar" />
          <Tab icon={<BrushIcon fontSize="small" />} iconPosition="start" label="Signature & Appearance" />
          <Tab icon={<SecurityIcon fontSize="small" />} iconPosition="start" label="Security" />
        </Tabs>
      </Box>

      <DialogContent sx={{ py: 3, px: 3 }}>
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {/* Tab 0: General & Avatar */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={user.avatarUrl}
                  sx={{
                    width: 84,
                    height: 84,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '2rem',
                    fontWeight: 600,
                  }}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </Avatar>

                <IconButton
                  component="label"
                  disabled={uploading}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: 2,
                    p: 0.8,
                    '&:hover': { backgroundColor: isDark ? '#3c4043' : '#f1f3f4' },
                  }}
                >
                  {uploading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <PhotoCameraIcon fontSize="small" color="primary" />
                  )}
                  <input
                    type="file"
                    hidden
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                  />
                </IconButton>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {user.displayName}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {user.email}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>
                  Click camera icon to upload a custom profile picture (PNG, JPG, WebP).
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Tab 1: Signature & Appearance */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* HTML Signature Editor */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                Official Email Signature (HTML supported)
              </Typography>
              <TextField
                multiline
                rows={3}
                fullWidth
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="<b>Name</b><br>Title | Company"
                sx={{ mb: 1.5 }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                Signature Preview:
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: isDark ? '#2b2d30' : '#f8fafd',
                  fontSize: '0.875rem',
                }}
                dangerouslySetInnerHTML={{ __html: signatureText }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleSaveSignature}
                sx={{ mt: 1.5, borderRadius: '16px' }}
              >
                Save Signature
              </Button>
            </Box>

            <Divider />

            {/* Display Density */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                Inbox Display Density
              </Typography>
              <RadioGroup
                row
                value={density}
                onChange={(e) => setDensity(e.target.value as DensityMode)}
              >
                <FormControlLabel value="default" control={<Radio size="small" />} label="Default" />
                <FormControlLabel value="comfortable" control={<Radio size="small" />} label="Comfortable" />
                <FormControlLabel value="compact" control={<Radio size="small" />} label="Compact" />
              </RadioGroup>
            </Box>
          </Box>
        )}

        {/* Tab 2: Security */}
        {activeTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: isDark ? '#2b2d30' : '#f8fafd',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                Encrypted Connection
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                • <b>IMAP Server:</b> 163.227.239.114:993 (SSL/TLS - Connected)
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                • <b>SMTP Server:</b> 163.227.239.114:587 (STARTTLS - Active)
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                • <b>Session Security:</b> Stateless AES-256-GCM JWE Secure Cookie
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                • <b>SPF / DKIM:</b> Enforced & Verified (Selector: <code>mail</code>)
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: '20px', px: 3 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
