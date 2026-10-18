'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  InputBase,
  Button,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface ComposeState {
  open: boolean;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}

interface DockedComposeProps {
  state: ComposeState;
  onClose: () => void;
  onSend: (data: { to: string; subject: string; body: string }) => void;
  signature?: string;
}

export default function DockedCompose({
  state,
  onClose,
  onSend,
  signature = '',
}: DockedComposeProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [to, setTo] = useState(state.to || '');
  const [subject, setSubject] = useState(state.subject || '');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync state changes from props
  useEffect(() => {
    setTo(state.to || '');
    setSubject(state.subject || '');
    if (editorRef.current) {
      let initialBody = state.body || '';
      if (signature && !initialBody.includes(signature)) {
        initialBody = initialBody ? `${initialBody}<br><br>${signature}` : `<br><br>${signature}`;
      }
      editorRef.current.innerHTML = initialBody;
    }
  }, [state, signature]);

  if (!state.open) return null;

  const handleCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleSend = () => {
    const htmlContent = editorRef.current?.innerHTML || '';
    onSend({
      to,
      subject,
      body: htmlContent,
    });
  };

  // AI "Help me write" draft generator
  const handleAiDraft = () => {
    setAiGenerating(true);
    setTimeout(() => {
      let generated = '';
      if (subject.toLowerCase().includes('proposal') || subject.toLowerCase().includes('project')) {
        generated = `Dear Client,<br><br>Thank you for reaching out regarding the project discussion. We have reviewed the requirements and prepared the proposal outlining the technical milestones, timeline, and deliverables.<br><br>Please let us know your availability for a brief call to align further.<br><br>Best regards,<br><b>Imon Khan</b>`;
      } else if (subject.toLowerCase().includes('invoice') || subject.toLowerCase().includes('payment')) {
        generated = `Hello,<br><br>Please find attached the updated invoice for your reference. Kindly process the payment at your earliest convenience.<br><br>Should you have any questions, please feel free to reach out.<br><br>Warm regards,<br><b>ForYourGoal Finance Team</b>`;
      } else {
        generated = `Hi there,<br><br>I hope this email finds you well.<br><br>Following up on our previous conversation, I wanted to check in and see if you had a chance to review the details we discussed. Looking forward to your thoughts.<br><br>Best regards,<br><b>Imon Khan</b>`;
      }

      if (editorRef.current) {
        editorRef.current.innerHTML = generated + (signature ? `<br><br>${signature}` : '');
      }
      setAiGenerating(false);
    }, 600);
  };

  // Handle clipboard paste of images
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const base64 = loadEvent.target?.result as string;
            handleCommand('insertImage', base64);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 0,
        right: isMaximized ? 0 : { xs: 8, sm: 24 },
        top: isMaximized ? 0 : 'auto',
        width: isMaximized ? '100vw' : { xs: 'calc(100vw - 16px)', sm: 580 },
        height: isMinimized ? 48 : isMaximized ? '100vh' : 560,
        zIndex: 1400,
        borderRadius: isMaximized ? 0 : '16px 16px 0 0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
      }}
    >
      {/* Title Bar */}
      <Box
        sx={{
          height: 48,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isDark ? '#2b2d30' : '#f2f6fc',
          borderBottom: `1px solid ${theme.palette.divider}`,
          cursor: 'pointer',
        }}
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            fontSize: '0.875rem',
            color: theme.palette.text.primary,
          }}
        >
          {subject ? subject : 'New Message'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={isMinimized ? 'Expand' : 'Minimize'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              sx={{ color: theme.palette.text.secondary }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isMaximized ? 'Exit full screen' : 'Full screen'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsMaximized(!isMaximized);
              }}
              sx={{ color: theme.palette.text.secondary }}
            >
              {isMaximized ? (
                <CloseFullscreenIcon fontSize="small" />
              ) : (
                <OpenInFullIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Save & close (Esc)">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              sx={{ color: theme.palette.text.secondary }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Form (Hidden if Minimized) */}
      {!isMinimized && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Recipients Row */}
          <Box
            sx={{
              px: 2,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, width: 44 }}>
              To
            </Typography>
            <InputBase
              id="compose-to-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipients"
              fullWidth
              sx={{ fontSize: '0.875rem', color: theme.palette.text.primary }}
            />
          </Box>

          {/* Subject Row */}
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <InputBase
              id="compose-subject-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              fullWidth
              sx={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.text.primary }}
            />
          </Box>

          {/* Rich ContentEditable Body */}
          <Box
            ref={editorRef}
            contentEditable
            onPaste={handlePaste}
            id="compose-body-editor"
            sx={{
              flex: 1,
              p: 2,
              overflowY: 'auto',
              outline: 'none',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: theme.palette.text.primary,
              fontFamily: 'inherit',
              '&:empty:before': {
                content: '"Type your message here..."',
                color: theme.palette.text.secondary,
                opacity: 0.6,
              },
            }}
          />

          {/* Bottom Action Bar */}
          <Box
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Send Button */}
              <Button
                variant="contained"
                onClick={handleSend}
                id="compose-send-button"
                sx={{
                  backgroundColor: '#0b57d0',
                  color: '#ffffff',
                  borderRadius: '20px',
                  px: 3,
                  py: 1,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#0842a0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  },
                }}
              >
                Send
              </Button>

              {/* AI "Help me write" Trigger */}
              <Tooltip title="Help me write (AI draft generator)">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAiDraft}
                  disabled={aiGenerating}
                  startIcon={
                    aiGenerating ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <AutoAwesomeIcon sx={{ color: '#fbbc05' }} />
                    )
                  }
                  sx={{
                    borderRadius: '16px',
                    borderColor: isDark ? '#444746' : '#d3e3fd',
                    color: isDark ? '#a8c7fa' : '#0b57d0',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 1.5,
                  }}
                >
                  {aiGenerating ? 'Drafting...' : 'AI Draft'}
                </Button>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24, my: 'auto' }} />

              {/* Rich Text Format Actions */}
              <Tooltip title="Bold (Ctrl+B)">
                <IconButton size="small" onClick={() => handleCommand('bold')} sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                  <FormatBoldIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Italic (Ctrl+I)">
                <IconButton size="small" onClick={() => handleCommand('italic')} sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                  <FormatItalicIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Underline (Ctrl+U)">
                <IconButton size="small" onClick={() => handleCommand('underline')} sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                  <FormatUnderlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bulleted list">
                <IconButton size="small" onClick={() => handleCommand('insertUnorderedList')} sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                  <FormatListBulletedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Numbered list">
                <IconButton size="small" onClick={() => handleCommand('insertOrderedList')} sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                  <FormatListNumberedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Quote">
                <IconButton size="small" onClick={() => handleCommand('formatBlock', 'blockquote')} sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                  <FormatQuoteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Attach files">
                <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                  <AttachFileIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Discard Button */}
            <Tooltip title="Discard draft">
              <IconButton size="small" onClick={onClose} sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
