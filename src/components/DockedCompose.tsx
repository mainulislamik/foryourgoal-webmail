'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  InputBase,
  Button,
  Tooltip,
  CircularProgress,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';

interface DockedComposeProps {
  open: boolean;
  onClose: () => void;
  onSendSuccess: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

export default function DockedCompose({
  open,
  onClose,
  onSendSuccess,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
}: DockedComposeProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setTo(initialTo);
    setSubject(initialSubject);
    setBody(initialBody ? `\n\n--- Original Message ---\n${initialBody}` : '');
  }, [initialTo, initialSubject, initialBody]);

  if (!open) return null;

  const handleSend = async () => {
    if (!to.trim()) {
      setErrorMsg('Please specify at least one recipient');
      return;
    }

    setSending(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim() || '(no subject)',
          text: body,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setTo('');
      setSubject('');
      setBody('');
      setSending(false);
      onSendSuccess();
      onClose();
    } catch (err: any) {
      console.error('Send error:', err);
      setErrorMsg(err.message || 'Failed to send email');
      setSending(false);
    }
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 24,
        width: expanded ? 'calc(100vw - 48px)' : 560,
        maxWidth: 900,
        height: minimized ? 44 : expanded ? 'calc(100vh - 48px)' : 520,
        maxHeight: '90vh',
        zIndex: 1300,
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        borderRadius: expanded ? '16px' : undefined,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Compose Header Bar */}
      <Box
        sx={{
          height: 44,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f2f6fc',
          cursor: 'pointer',
          borderBottom: minimized ? 'none' : '1px solid #e0e2ec',
        }}
        onClick={() => minimized && setMinimized(false)}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1f1f1f' }}>
          {subject.trim() || 'New Message'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={minimized ? 'Maximize' : 'Minimize'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setMinimized(!minimized);
              }}
              sx={{ color: '#444746', p: 0.5 }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={expanded ? 'Exit full screen' : 'Full screen'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{ color: '#444746', p: 0.5 }}
            >
              {expanded ? (
                <CloseFullscreenIcon fontSize="small" />
              ) : (
                <OpenInFullIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              sx={{ color: '#444746', p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Body when not minimized */}
      {!minimized && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Recipients Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 0.75,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Typography variant="body2" sx={{ color: '#5f6368', width: 60 }}>
              To
            </Typography>
            <InputBase
              fullWidth
              placeholder="Recipients"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              sx={{ fontSize: '0.9rem', color: '#1f1f1f' }}
            />
          </Box>

          {/* Subject Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 0.75,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <InputBase
              fullWidth
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              sx={{ fontSize: '0.95rem', fontWeight: 500, color: '#1f1f1f' }}
            />
          </Box>

          {/* Error Message if any */}
          {errorMsg && (
            <Box sx={{ px: 2, py: 0.5, bgcolor: '#fce8e6' }}>
              <Typography variant="caption" sx={{ color: '#c5221f', fontWeight: 500 }}>
                {errorMsg}
              </Typography>
            </Box>
          )}

          {/* Body Textarea */}
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
            <InputBase
              fullWidth
              multiline
              minRows={10}
              placeholder="Write your email here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              sx={{
                fontSize: '0.95rem',
                color: '#1f1f1f',
                alignItems: 'flex-start',
                '& textarea': {
                  lineHeight: 1.5,
                },
              }}
            />
          </Box>

          <Divider />

          {/* Bottom Toolbar: Send Button and Icons */}
          <Box
            sx={{
              height: 52,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Google Blue Pill Send Button */}
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={sending}
                endIcon={
                  sending ? (
                    <CircularProgress size={16} sx={{ color: '#ffffff' }} />
                  ) : (
                    <SendIcon sx={{ fontSize: 16 }} />
                  )
                }
                sx={{
                  backgroundColor: '#0b57d0',
                  color: '#ffffff',
                  borderRadius: '20px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: '#0842a0',
                  },
                }}
              >
                Send
              </Button>

              <Tooltip title="Formatting options">
                <IconButton size="small" sx={{ color: '#444746' }}>
                  <FormatColorTextIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Attach files">
                <IconButton size="small" sx={{ color: '#444746' }}>
                  <AttachFileIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Insert link">
                <IconButton size="small" sx={{ color: '#444746' }}>
                  <InsertLinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Insert emoji">
                <IconButton size="small" sx={{ color: '#444746' }}>
                  <InsertEmoticonIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Tooltip title="Discard draft">
              <IconButton size="small" onClick={onClose} sx={{ color: '#444746' }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
