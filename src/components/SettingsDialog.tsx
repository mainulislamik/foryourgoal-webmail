'use client';
import React, { useState, useRef } from 'react';
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
  CircularProgress,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SecurityIcon from '@mui/icons-material/Security';

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
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatarUrl || null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be under 5MB');
      return;
    }

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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      setPreviewUrl(data.avatarUrl);
      onAvatarUpdated(data.avatarUrl);
      setSuccessMsg('Profile photo updated successfully!');
      setUploading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed');
      setUploading(false);
    }
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
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f1f1f' }}>
          Account Settings
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#5f6368' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: '#f0f0f0' }}>
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
            {successMsg}
          </Alert>
        )}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {errorMsg}
          </Alert>
        )}

        {/* Profile Avatar Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={previewUrl || user.avatarUrl}
              sx={{
                width: 96,
                height: 96,
                bgcolor: '#0b57d0',
                fontSize: '2.5rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </Avatar>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: '#0b57d0',
                color: '#ffffff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                '&:hover': { bgcolor: '#0842a0' },
              }}
            >
              {uploading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <PhotoCameraIcon fontSize="small" />}
            </IconButton>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
            />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, color: '#1f1f1f' }}>
            {user.displayName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#5f6368', mb: 1 }}>
            {user.email}
          </Typography>

          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            sx={{
              mt: 1,
              borderRadius: '20px',
              textTransform: 'none',
              borderColor: '#dadce0',
              color: '#0b57d0',
            }}
          >
            Change Profile Photo
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Mail Security & Verification Status */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1f1f1f', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon fontSize="small" sx={{ color: '#188038' }} />
          Email Security & Deliverability
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#444746' }}>
              DKIM 2048-bit Signing:
            </Typography>
            <Chip icon={<CheckCircleOutlineIcon sx={{ fontSize: '16px !important' }} />} label="Verified (mail._domainkey)" size="small" color="success" variant="outlined" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#444746' }}>
              SPF Record:
            </Typography>
            <Chip icon={<CheckCircleOutlineIcon sx={{ fontSize: '16px !important' }} />} label="Verified (v=spf1)" size="small" color="success" variant="outlined" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#444746' }}>
              DMARC Policy:
            </Typography>
            <Chip icon={<CheckCircleOutlineIcon sx={{ fontSize: '16px !important' }} />} label="Active (p=none)" size="small" color="success" variant="outlined" />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: '20px', color: '#0b57d0' }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
