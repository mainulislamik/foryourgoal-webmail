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
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
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
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import DoneAllIcon from '@mui/icons-material/DoneAll';

interface ComposeState {
  open: boolean;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}

interface DockedComposeProps {
  state: ComposeState;
  onClose: () => void;
  onSend: (data: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    attachments?: Array<{ filename: string; content: string; contentType: string; size: number }>;
    priority?: 'high' | 'normal';
    requestReadReceipt?: boolean;
  }) => void;
  signature?: string;
  onOpenSettings?: () => void;
}

export default function DockedCompose({
  state,
  onClose,
  onSend,
  signature = '',
  onOpenSettings,
}: DockedComposeProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [to, setTo] = useState(state.to || '');
  const [cc, setCc] = useState(state.cc || '');
  const [bcc, setBcc] = useState(state.bcc || '');
  const [showCc, setShowCc] = useState(Boolean(state.cc));
  const [showBcc, setShowBcc] = useState(Boolean(state.bcc));
  const [subject, setSubject] = useState(state.subject || '');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [sigAnchorEl, setSigAnchorEl] = useState<null | HTMLElement>(null);

  // Link dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // File attachments
  const [attachments, setAttachments] = useState<
    Array<{ filename: string; content: string; contentType: string; size: number }>
  >([]);
  const fileAttachmentInputRef = useRef<HTMLInputElement>(null);

  // Message options: Priority & Read Receipt
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [requestReceipt, setRequestReceipt] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  // Auto-save draft status
  const [draftSavedText, setDraftSavedText] = useState<string>('');

  const editorRef = useRef<HTMLDivElement>(null);

  // Sync state changes from props
  useEffect(() => {
    setTo(state.to || '');
    setCc(state.cc || '');
    setBcc(state.bcc || '');
    setShowCc(Boolean(state.cc));
    setShowBcc(Boolean(state.bcc));
    setSubject(state.subject || '');
    setAttachments([]);
    if (editorRef.current) {
      let initialBody = state.body || '';
      if (signature && !initialBody.includes('data-fyg-signature') && !initialBody.includes(signature)) {
        const sigBlock = `<div data-fyg-signature="true"><br><br>${signature}</div>`;
        initialBody = initialBody ? `${initialBody}${sigBlock}` : sigBlock;
      }
      editorRef.current.innerHTML = initialBody;
    }
  }, [state, signature]);

  const handleCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleSend = () => {
    const htmlContent = editorRef.current?.innerHTML || '';
    onSend({
      to,
      cc: showCc && cc.trim() ? cc.trim() : undefined,
      bcc: showBcc && bcc.trim() ? bcc.trim() : undefined,
      subject,
      body: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
      priority,
      requestReadReceipt: requestReceipt,
    });
    // Clear draft upon sending
    if (typeof window !== 'undefined') {
      localStorage.removeItem('foryourgoal_webmail_draft');
    }
  };

  // Draft auto-save to localStorage
  useEffect(() => {
    if (!state.open) return;
    const timer = setTimeout(() => {
      const htmlContent = editorRef.current?.innerHTML || '';
      if (to || subject || htmlContent) {
        localStorage.setItem(
          'foryourgoal_webmail_draft',
          JSON.stringify({ to, cc, bcc, showCc, showBcc, subject, body: htmlContent, savedAt: new Date().toLocaleTimeString() })
        );
        setDraftSavedText('Draft saved');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [to, cc, bcc, showCc, showBcc, subject, state.open]);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 25MB attachment limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            content: base64,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileAttachmentInputRef.current) {
      fileAttachmentInputRef.current.value = '';
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
        const sigBlock = signature ? `<div data-fyg-signature="true"><br><br>${signature}</div>` : '';
        editorRef.current.innerHTML = generated + sigBlock;
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

  // Signature insertion & removal
  const handleInsertSignature = () => {
    if (!signature || !editorRef.current) {
      setSigAnchorEl(null);
      return;
    }
    const current = editorRef.current.innerHTML;
    // Strip existing signature if already present to avoid duplicates
    const stripped = current.replace(/<div data-fyg-signature="true">[\s\S]*?<\/div>/gi, '');
    editorRef.current.innerHTML = stripped + `<div data-fyg-signature="true"><br><br>${signature}</div>`;
    setSigAnchorEl(null);
  };

  const handleRemoveSignature = () => {
    if (editorRef.current) {
      const current = editorRef.current.innerHTML;
      const stripped = current
        .replace(/<div data-fyg-signature="true">[\s\S]*?<\/div>/gi, '')
        .replace(signature, '');
      editorRef.current.innerHTML = stripped;
    }
    setSigAnchorEl(null);
  };

  // Link Dialog Handlers
  const handleOpenLinkDialog = () => {
    const selection = window.getSelection();
    const text = selection ? selection.toString() : '';
    setLinkText(text);
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;
    const url = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('mailto:') || linkUrl.startsWith('tel:')
      ? linkUrl
      : `https://${linkUrl}`;
    const text = linkText || linkUrl;

    if (editorRef.current) {
      editorRef.current.focus();
      const linkTag = `<a href="${url}" target="_blank" style="color: #0284c7; text-decoration: none;">${text}</a>`;
      document.execCommand('insertHTML', false, linkTag);
    }
    setLinkDialogOpen(false);
  };

  // Image Upload Handler
  const handleImageUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/signature/image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');

      if (editorRef.current) {
        editorRef.current.focus();
        const imgTag = `<img src="${data.url}" alt="Embedded Image" style="max-width: 100%; height: auto; display: block; margin: 8px 0;" />`;
        document.execCommand('insertHTML', false, imgTag);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  if (!state.open) return null;

  return (
    <>
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
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, width: 44, fontWeight: 500 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, flexShrink: 0 }}>
                {!showCc && (
                  <Typography
                    variant="caption"
                    onClick={() => setShowCc(true)}
                    id="compose-toggle-cc"
                    sx={{
                      cursor: 'pointer',
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                      px: 0.8,
                      py: 0.3,
                      borderRadius: 1,
                      userSelect: 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      },
                    }}
                  >
                    Cc
                  </Typography>
                )}
                {!showBcc && (
                  <Typography
                    variant="caption"
                    onClick={() => setShowBcc(true)}
                    id="compose-toggle-bcc"
                    sx={{
                      cursor: 'pointer',
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                      px: 0.8,
                      py: 0.3,
                      borderRadius: 1,
                      userSelect: 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      },
                    }}
                  >
                    Bcc
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Cc Row */}
            {showCc && (
              <Box
                sx={{
                  px: 2,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, width: 44, fontWeight: 500 }}>
                  Cc
                </Typography>
                <InputBase
                  id="compose-cc-input"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Carbon copy recipients"
                  fullWidth
                  autoFocus
                  sx={{ fontSize: '0.875rem', color: theme.palette.text.primary }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setShowCc(false);
                    setCc('');
                  }}
                  title="Remove Cc"
                  sx={{ p: 0.5, color: theme.palette.text.secondary }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )}

            {/* Bcc Row */}
            {showBcc && (
              <Box
                sx={{
                  px: 2,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, width: 44, fontWeight: 500 }}>
                  Bcc
                </Typography>
                <InputBase
                  id="compose-bcc-input"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Blind carbon copy recipients"
                  fullWidth
                  autoFocus
                  sx={{ fontSize: '0.875rem', color: theme.palette.text.primary }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setShowBcc(false);
                    setBcc('');
                  }}
                  title="Remove Bcc"
                  sx={{ p: 0.5, color: theme.palette.text.secondary }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )}

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
                '& a': { color: '#0284c7' },
              }}
            />

            {/* Attached Files Chips */}
            {attachments.length > 0 && (
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  maxHeight: 100,
                  overflowY: 'auto',
                  borderTop: `1px solid ${theme.palette.divider}`,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}
              >
                {attachments.map((file, idx) => (
                  <Chip
                    key={idx}
                    icon={<AttachFileIcon sx={{ fontSize: 16 }} />}
                    label={`${file.filename} (${(file.size / 1024).toFixed(0)} KB)`}
                    size="small"
                    onDelete={() => removeAttachment(idx)}
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      fontSize: '0.75rem',
                    }}
                  />
                ))}
              </Box>
            )}

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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
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
                    py: 0.8,
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
                      px: 1.2,
                    }}
                  >
                    {aiGenerating ? 'Drafting...' : 'AI Draft'}
                  </Button>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 22, my: 'auto' }} />

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

                {/* Insert Link */}
                <Tooltip title="Insert link (Ctrl+K)">
                  <IconButton size="small" onClick={handleOpenLinkDialog} sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                    <InsertLinkIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Insert Image */}
                <Tooltip title="Insert image">
                  <IconButton
                    size="small"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    sx={{ color: theme.palette.text.secondary, p: 0.5 }}
                  >
                    {uploadingImage ? <CircularProgress size={16} /> : <InsertPhotoIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <input
                  type="file"
                  ref={imageInputRef}
                  hidden
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleImageUploadChange}
                />

                {/* Gmail-Style Signature Menu Button */}
                <Tooltip title="Insert signature (Gmail style)">
                  <IconButton
                    size="small"
                    onClick={(e) => setSigAnchorEl(e.currentTarget)}
                    sx={{
                      color: sigAnchorEl ? '#0284c7' : theme.palette.text.secondary,
                      p: 0.5,
                      backgroundColor: sigAnchorEl ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
                    }}
                  >
                    <BorderColorIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={sigAnchorEl}
                  open={Boolean(sigAnchorEl)}
                  onClose={() => setSigAnchorEl(null)}
                  PaperProps={{
                    sx: {
                      borderRadius: '16px',
                      minWidth: 220,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                      zIndex: 9999,
                    },
                  }}
                  sx={{ zIndex: 9999 }}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                >
                  <MenuItem onClick={handleInsertSignature}>
                    <ListItemIcon>
                      <CheckIcon fontSize="small" sx={{ color: '#16a34a' }} />
                    </ListItemIcon>
                    <ListItemText primary="Insert Signature" secondary="ForYourGoal Official" />
                  </MenuItem>
                  <MenuItem onClick={handleRemoveSignature}>
                    <ListItemIcon>
                      <ClearIcon fontSize="small" sx={{ color: '#ef4444' }} />
                    </ListItemIcon>
                    <ListItemText primary="No Signature" secondary="Remove from this draft" />
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem
                    onClick={() => {
                      setSigAnchorEl(null);
                      onOpenSettings?.();
                    }}
                  >
                    <ListItemIcon>
                      <SettingsOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Manage Signatures..." />
                  </MenuItem>
                </Menu>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 22, my: 'auto' }} />

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
                  <IconButton
                    size="small"
                    onClick={() => fileAttachmentInputRef.current?.click()}
                    sx={{ color: theme.palette.text.secondary, p: 0.5 }}
                  >
                    <AttachFileIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <input
                  type="file"
                  ref={fileAttachmentInputRef}
                  hidden
                  multiple
                  onChange={handleFileAttach}
                />
              </Box>

              {/* Status and Action Buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {draftSavedText && (
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', mr: 0.5 }}>
                    {draftSavedText}
                  </Typography>
                )}

                {/* Priority Toggle */}
                <Tooltip title={priority === 'high' ? 'High Priority Active' : 'Mark High Priority'}>
                  <IconButton
                    size="small"
                    onClick={() => setPriority((p) => (p === 'high' ? 'normal' : 'high'))}
                    sx={{
                      color: priority === 'high' ? '#ef4444' : theme.palette.text.secondary,
                      bgcolor: priority === 'high' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                      p: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <PriorityHighIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Read Receipt Toggle */}
                <Tooltip title={requestReceipt ? 'Read Receipt Active' : 'Request Read Receipt'}>
                  <IconButton
                    size="small"
                    onClick={() => setRequestReceipt((r) => !r)}
                    sx={{
                      color: requestReceipt ? '#0284c7' : theme.palette.text.secondary,
                      bgcolor: requestReceipt ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                      p: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Discard Button */}
                <Tooltip title="Discard draft">
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('foryourgoal_webmail_draft');
                      }
                      setDraftSavedText('');
                      onClose();
                    }}
                    sx={{ color: theme.palette.text.secondary, p: 0.5 }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Insert Link Dialog */}
      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Insert Link</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            autoFocus
            label="Text to display"
            fullWidth
            size="small"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="e.g. ForYourGoal or Click Here"
          />
          <TextField
            label="Link URL"
            fullWidth
            size="small"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://foryourgoal.com"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLinkDialogOpen(false)} sx={{ borderRadius: '16px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleInsertLink}
            variant="contained"
            disabled={!linkUrl}
            sx={{ borderRadius: '16px', backgroundColor: '#0284c7' }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
