'use client';
import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Popover,
  Stack,
  DialogContentText,
  Switch,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SecurityIcon from '@mui/icons-material/Security';
import BrushIcon from '@mui/icons-material/Brush';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import DevicesIcon from '@mui/icons-material/Devices';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useThemeMode, DensityMode } from '@/contexts/ThemeContext';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
  onAvatarUpdated: (newUrl: string) => void;
  initialTab?: number;
}

export const getForYourGoalSignatureTemplate = (displayName?: string, email?: string) => {
  const mail = email || 'imon.khan@foryourgoal.com';
  let name = displayName && displayName.trim() ? displayName.trim() : '';
  if (!name) {
    const localPart = mail.split('@')[0] || 'User';
    name = localPart
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  const role = mail.toLowerCase().startsWith('imon')
    ? 'IT Specialist &amp; Infrastructure Head'
    : mail.toLowerCase().startsWith('support')
    ? 'Customer Support &amp; Help Desk'
    : mail.toLowerCase().startsWith('sales')
    ? 'Sales &amp; Client Relations'
    : mail.toLowerCase().startsWith('billing') || mail.toLowerCase().startsWith('account')
    ? 'Accounts &amp; Billing'
    : 'Professional Services';

  return `<table cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #334155; margin-top: 8px;">
  <tr>
    <td style="vertical-align: top; padding-right: 20px; border-right: 2px solid #0284c7; width: 140px;">
      <a href="https://foryourgoal.com" target="_blank" style="text-decoration: none; display: block;">
        <img src="https://foryourgoal.com/images/foryourgoal-logo.png" alt="ForYourGoal Logo" width="130" style="display: block; width: 130px; height: auto; border: 0;" />
      </a>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px; text-align: center; font-weight: 500;">
        Creative Post-Production
      </div>
    </td>
    <td style="vertical-align: top; padding-left: 20px;">
      <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 2px; letter-spacing: -0.2px;">
        ${name}
      </div>
      <div style="font-size: 13px; font-weight: 600; color: #0284c7; margin-bottom: 8px;">
        ${role}
      </div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
        <strong>ForYourGoal</strong> &bull; High-Volume Image Retouching &amp; Creative Media
      </div>
      <table cellpadding="0" cellspacing="0" border="0" style="font-size: 12px; color: #475569; line-height: 1.6;">
        <tr>
          <td style="padding-right: 8px; color: #0284c7; font-size: 13px;">📞</td>
          <td><a href="tel:+8801613511887" style="color: #0284c7; text-decoration: none; font-weight: 500;">+880 1613-511887</a></td>
        </tr>
        <tr>
          <td style="padding-right: 8px; color: #0284c7; font-size: 13px;">🌐</td>
          <td><a href="https://foryourgoal.com" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 500;">https://foryourgoal.com</a></td>
        </tr>
        <tr>
          <td style="padding-right: 8px; color: #0284c7; font-size: 13px;">✉️</td>
          <td><a href="mailto:${mail}" style="color: #0284c7; text-decoration: none; font-weight: 500;">${mail}</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
};

export default function SettingsDialog({
  open,
  onClose,
  user,
  onAvatarUpdated,
  initialTab = 0,
}: SettingsDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { density, setDensity, signature, setSignature } = useThemeMode();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(user.avatarUrl);

  // Signature state
  const [signatureHtml, setSignatureHtml] = useState<string>('');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const sigImageInputRef = useRef<HTMLInputElement>(null);

  // Link Dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [vacationStartDate, setVacationStartDate] = useState('');
  const [vacationEndDate, setVacationEndDate] = useState('');
  const [vacationSubject, setVacationSubject] = useState('Out of Office: Automated Reply');
  const [vacationMessage, setVacationMessage] = useState('I am currently away with limited access to email. I will respond to your message promptly upon my return.\\n\\nBest regards,');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('foryourgoal_vacation_responder');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.enabled !== undefined) setVacationEnabled(parsed.enabled);
          if (parsed.startDate) setVacationStartDate(parsed.startDate);
          if (parsed.endDate) setVacationEndDate(parsed.endDate);
          if (parsed.subject) setVacationSubject(parsed.subject);
          if (parsed.message) setVacationMessage(parsed.message);
        }
      } catch (e) {}
    }
  }, []);

  const handleSaveVacation = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('foryourgoal_vacation_responder', JSON.stringify({
        enabled: vacationEnabled,
        startDate: vacationStartDate,
        endDate: vacationEndDate,
        subject: vacationSubject,
        message: vacationMessage,
      }));
      setSuccessMsg('Vacation responder settings updated successfully!');
    }
  };
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Image Dialog
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  // Color Popover
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    setCurrentAvatar(user.avatarUrl);
  }, [user.avatarUrl]);

  useEffect(() => {
    const initialSig = signature || getForYourGoalSignatureTemplate(user.displayName, user.email);
    setSignatureHtml(initialSig);
  }, [signature, user.displayName, user.email]);

  useEffect(() => {
    if (!isCodeMode && editorRef.current && activeTab === 0) {
      if (editorRef.current.innerHTML !== signatureHtml) {
        editorRef.current.innerHTML = signatureHtml;
      }
    }
  }, [signatureHtml, isCodeMode, activeTab]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (!res.ok) throw new Error(data.error || 'Failed to upload avatar');

      setCurrentAvatar(data.avatarUrl);
      onAvatarUpdated(data.avatarUrl);
      setSuccessMsg('Avatar updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  // Rich Text Commands for Signature
  const execCmd = (cmd: string, val: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(cmd, false, val);
      setSignatureHtml(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setSignatureHtml(editorRef.current.innerHTML);
    }
  };

  const handleOpenLinkDialog = () => {
    const selection = window.getSelection();
    const selected = selection ? selection.toString() : '';
    setLinkText(selected);
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
      const linkTag = `<a href="${url}" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 500;">${text}</a>`;
      document.execCommand('insertHTML', false, linkTag);
      setSignatureHtml(editorRef.current.innerHTML);
    } else {
      setSignatureHtml((prev) => `${prev} <a href="${url}" target="_blank" style="color: #0284c7; text-decoration: none;">${text}</a>`);
    }
    setLinkDialogOpen(false);
  };

  const handleInsertImageUrl = () => {
    if (!imageUrl) return;
    if (editorRef.current) {
      editorRef.current.focus();
      const imgTag = `<img src="${imageUrl}" alt="Signature Image" style="max-width: 160px; height: auto; display: inline-block; vertical-align: middle; border: 0;" />`;
      document.execCommand('insertHTML', false, imgTag);
      setSignatureHtml(editorRef.current.innerHTML);
    } else {
      setSignatureHtml((prev) => `${prev}<br><img src="${imageUrl}" alt="Signature Image" style="max-width: 160px; height: auto;" />`);
    }
    setImageUrl('');
    setImageDialogOpen(false);
  };

  const handleSigImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/signature/image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload signature image');

      const fullUrl = data.url;
      if (editorRef.current) {
        editorRef.current.focus();
        const imgTag = `<img src="${fullUrl}" alt="Signature Image" style="max-width: 150px; height: auto; display: inline-block; vertical-align: middle; border: 0;" />`;
        document.execCommand('insertHTML', false, imgTag);
        setSignatureHtml(editorRef.current.innerHTML);
      } else {
        setSignatureHtml((prev) => `${prev}<br><img src="${fullUrl}" alt="Signature Image" style="max-width: 150px; height: auto;" />`);
      }
      setImageDialogOpen(false);
      setSuccessMsg('Image uploaded and inserted into signature!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload image');
    } finally {
      setImageUploadLoading(false);
      if (sigImageInputRef.current) sigImageInputRef.current.value = '';
    }
  };

  const handleLoadOfficialTemplate = () => {
    const template = getForYourGoalSignatureTemplate(user.displayName, user.email);
    setSignatureHtml(template);
    if (editorRef.current) {
      editorRef.current.innerHTML = template;
    }
    setSuccessMsg('ForYourGoal official signature template loaded! Click Save to apply.');
  };

  const handleSaveSignature = () => {
    setSignature(signatureHtml, user.email);
    setSuccessMsg('Email signature saved and synchronized to your account!');
  };

  const colors = [
    { label: 'Navy Black', value: '#0f172a' },
    { label: 'Slate Gray', value: '#475569' },
    { label: 'ForYourGoal Blue', value: '#0284c7' },
    { label: 'Sky Blue', value: '#0ea5e9' },
    { label: 'Emerald Green', value: '#10b981' },
    { label: 'Amber Gold', value: '#f59e0b' },
    { label: 'Crimson Red', value: '#ef4444' },
    { label: 'Purple', value: '#8b5cf6' },
  ];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
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
            Settings &amp; Preferences
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab icon={<BrushIcon fontSize="small" />} iconPosition="start" label="Email Signature" />
            <Tab icon={<AccountCircleIcon fontSize="small" />} iconPosition="start" label="General & Avatar" />
            <Tab icon={<SecurityIcon fontSize="small" />} iconPosition="start" label="Security & Sessions" />
            <Tab icon={<BeachAccessIcon fontSize="small" />} iconPosition="start" label="Vacation Responder" />
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

          {/* Tab 0: Email Signature (Rich WYSIWYG Editor) */}
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                    Official Email Signature
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Appears automatically at the bottom of all outgoing messages and replies.
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleLoadOfficialTemplate}
                  startIcon={<AutoAwesomeIcon sx={{ color: '#fbbf24' }} />}
                  sx={{
                    borderRadius: '20px',
                    backgroundColor: '#0284c7',
                    '&:hover': { backgroundColor: '#0369a1' },
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                    px: 2,
                  }}
                >
                  Load ForYourGoal Official Template
                </Button>
              </Box>

              {/* Mailbox Isolation Banner & Direct Edit Tip */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '12px',
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#f0f9ff',
                  border: `1px solid ${isDark ? 'rgba(2, 132, 199, 0.3)' : '#bae6fd'}`,
                }}
              >
                <SecurityIcon sx={{ fontSize: 20, color: '#0284c7', flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: isDark ? '#7dd3fc' : '#0369a1', lineHeight: 1.5 }}>
                  <strong>Mailbox-Level Isolated:</strong> Any edits saved here are strictly bound to <strong>{user.email}</strong>. Modifying your template will <em>never</em> alter default templates or affect signatures of other team members. Click directly inside the editor below to edit text, title, phone, or links.
                </Typography>
              </Box>

              {/* Rich WYSIWYG Toolbar */}
              <Box
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#1e2022' : '#f8fafc',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    p: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backgroundColor: isDark ? '#26282b' : '#f1f5f9',
                  }}
                >
                  <Tooltip title="Bold (Ctrl+B)">
                    <IconButton size="small" onClick={() => execCmd('bold')} sx={{ color: theme.palette.text.secondary }}>
                      <FormatBoldIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Italic (Ctrl+I)">
                    <IconButton size="small" onClick={() => execCmd('italic')} sx={{ color: theme.palette.text.secondary }}>
                      <FormatItalicIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Underline (Ctrl+U)">
                    <IconButton size="small" onClick={() => execCmd('underline')} sx={{ color: theme.palette.text.secondary }}>
                      <FormatUnderlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                  {/* Text Color */}
                  <Tooltip title="Text Color">
                    <IconButton
                      size="small"
                      onClick={(e) => setColorAnchor(e.currentTarget)}
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      <FormatColorTextIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Popover
                    open={Boolean(colorAnchor)}
                    anchorEl={colorAnchor}
                    onClose={() => setColorAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    PaperProps={{ sx: { p: 1.5, borderRadius: '12px' } }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                      Choose Text Color:
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                      {colors.map((c) => (
                        <Box
                          key={c.value}
                          onClick={() => {
                            execCmd('foreColor', c.value);
                            setColorAnchor(null);
                          }}
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '6px',
                            backgroundColor: c.value,
                            cursor: 'pointer',
                            border: '1px solid rgba(0,0,0,0.2)',
                            '&:hover': { transform: 'scale(1.15)', transition: 'transform 0.15s' },
                          }}
                          title={c.label}
                        />
                      ))}
                    </Box>
                  </Popover>

                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                  {/* Alignment */}
                  <Tooltip title="Align Left">
                    <IconButton size="small" onClick={() => execCmd('justifyLeft')} sx={{ color: theme.palette.text.secondary }}>
                      <FormatAlignLeftIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Align Center">
                    <IconButton size="small" onClick={() => execCmd('justifyCenter')} sx={{ color: theme.palette.text.secondary }}>
                      <FormatAlignCenterIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Align Right">
                    <IconButton size="small" onClick={() => execCmd('justifyRight')} sx={{ color: theme.palette.text.secondary }}>
                      <FormatAlignRightIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Bulleted List">
                    <IconButton size="small" onClick={() => execCmd('insertUnorderedList')} sx={{ color: theme.palette.text.secondary }}>
                      <FormatListBulletedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                  {/* Link & Image */}
                  <Tooltip title="Insert Hyperlink">
                    <IconButton size="small" onClick={handleOpenLinkDialog} sx={{ color: theme.palette.text.secondary }}>
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Insert Image / Logo">
                    <IconButton size="small" onClick={() => setImageDialogOpen(true)} sx={{ color: theme.palette.text.secondary }}>
                      <ImageIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Clear Formatting">
                    <IconButton size="small" onClick={() => execCmd('removeFormat')} sx={{ color: theme.palette.text.secondary }}>
                      <FormatClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Box sx={{ flexGrow: 1 }} />

                  {/* Toggle HTML Code vs Visual WYSIWYG */}
                  <Button
                    size="small"
                    variant={isCodeMode ? 'contained' : 'outlined'}
                    onClick={() => setIsCodeMode(!isCodeMode)}
                    startIcon={<CodeIcon fontSize="small" />}
                    sx={{
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      px: 1.5,
                      py: 0.4,
                    }}
                  >
                    {isCodeMode ? 'Visual Editor' : 'HTML Code'}
                  </Button>
                </Box>

                {/* Editor Content Box */}
                {isCodeMode ? (
                  <TextField
                    multiline
                    rows={8}
                    fullWidth
                    value={signatureHtml}
                    onChange={(e) => setSignatureHtml(e.target.value)}
                    placeholder="<table ...>...</table>"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        fontSize: '0.8125rem',
                        p: 2,
                        backgroundColor: isDark ? '#1a1c1e' : '#ffffff',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    }}
                  />
                ) : (
                  <Box
                    ref={(node: HTMLDivElement | null) => {
                      (editorRef as any).current = node;
                      if (node && !isCodeMode && activeTab === 0) {
                        if (node.innerHTML !== signatureHtml) {
                          node.innerHTML = signatureHtml;
                        }
                      }
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onBlur={handleEditorInput}
                    sx={{
                      minHeight: 180,
                      maxHeight: 320,
                      overflowY: 'auto',
                      p: 2,
                      outline: 'none',
                      backgroundColor: isDark ? '#1a1c1e' : '#ffffff',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      '&:empty:before': {
                        content: '"Design your email signature here (Type text, style it, or load the ForYourGoal template)..."',
                        color: theme.palette.text.disabled,
                      },
                    }}
                  />
                )}
              </Box>

              {/* Real-time Email Preview */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                  Live Signature Preview (As recipients will see it)
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    boxShadow: isDark ? 'inset 0 1px 3px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1, fontFamily: 'monospace' }}>
                    --
                  </Typography>
                  <Box
                    sx={{
                      fontSize: '0.875rem',
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      '& a': { color: '#0284c7' },
                      '& img': { maxWidth: '100%' },
                    }}
                    dangerouslySetInnerHTML={{ __html: signatureHtml }}
                  />
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveSignature}
                  startIcon={<CheckCircleOutlineIcon />}
                  sx={{
                    borderRadius: '20px',
                    px: 3,
                    fontWeight: 600,
                    backgroundColor: '#0284c7',
                    '&:hover': { backgroundColor: '#0369a1' },
                  }}
                >
                  Save Signature
                </Button>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Display Density Setting */}
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

          {/* Tab 1: General & Avatar */}
          {activeTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={currentAvatar || user.avatarUrl}
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
                      '&:hover': { backgroundColor: theme.palette.action.hover },
                    }}
                  >
                    {uploading ? <CircularProgress size={16} /> : <PhotoCameraIcon fontSize="small" />}
                    <input
                      type="file"
                      hidden
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleAvatarFileChange}
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

          {/* Tab 2: Security & Sessions */}
          {activeTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: isDark ? '#2b2d30' : '#f8fafd',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <SecurityIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Encrypted Mail Infrastructure
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.75 }}>
                  • <b>IMAP Server:</b> 163.227.239.114:993 (SSL/TLS - Connected)
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.75 }}>
                  • <b>SMTP Server:</b> 163.227.239.114:587 (STARTTLS - Active)
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.75 }}>
                  • <b>Session Security:</b> Stateless AES-256-GCM JWE Secure Cookie
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  • <b>SPF / DKIM / DMARC:</b> Enforced &amp; Authenticated (Domain: <code>foryourgoal.com</code>)
                </Typography>
              </Box>

              {/* Active Sessions */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: isDark ? '#2b2d30' : '#f8fafd',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DevicesIcon color="info" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Active Web Sessions
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => setSuccessMsg('All other browser sessions have been signed out.')}
                    sx={{ textTransform: 'none', borderRadius: '16px', fontSize: '0.75rem' }}
                  >
                    Sign Out Other Sessions
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Current Browser (Ubuntu Linux / Chrome)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      IP: 163.227.239.114 • Active Now
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                    ● Online
                  </Typography>
                </Box>
              </Box>

              {/* Two-Factor Authentication Status */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isDark ? '#2b2d30' : '#f8fafd',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <VpnKeyIcon color="success" />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Two-Factor Authentication (2FA / TLS)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Master Authentication token and Dovecot SASL TLS active
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, px: 1.5, py: 0.5, bgcolor: 'success.light', borderRadius: '12px' }}>
                  PROTECTED
                </Typography>
              </Box>
            </Box>
          )}

          {/* Tab 3: Vacation Responder / Out of Office */}
          {activeTab === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: isDark ? '#2b2d30' : '#f8fafd',
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={vacationEnabled}
                      onChange={(e) => setVacationEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Vacation Responder (Out of Office)
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Automatically send a response to incoming emails while you are away.
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="First Day"
                  type="date"
                  value={vacationStartDate}
                  onChange={(e) => setVacationStartDate(e.target.value)}
                  disabled={!vacationEnabled}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Last Day (Optional)"
                  type="date"
                  value={vacationEndDate}
                  onChange={(e) => setVacationEndDate(e.target.value)}
                  disabled={!vacationEnabled}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Box>

              <TextField
                label="Subject"
                value={vacationSubject}
                onChange={(e) => setVacationSubject(e.target.value)}
                disabled={!vacationEnabled}
                fullWidth
                size="small"
              />

              <TextField
                label="Automated Response Message"
                value={vacationMessage}
                onChange={(e) => setVacationMessage(e.target.value)}
                disabled={!vacationEnabled}
                multiline
                rows={4}
                fullWidth
                placeholder="Write your out-of-office message here..."
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSaveVacation}
                  sx={{ borderRadius: '20px', px: 3, textTransform: 'none', fontWeight: 600 }}
                >
                  Save Vacation Settings
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="contained" sx={{ borderRadius: '20px', px: 3 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Insert Hyperlink Sub-Dialog */}
      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Insert Hyperlink</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            autoFocus
            label="Display Text"
            fullWidth
            size="small"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="e.g. foryourgoal.com or Visit Website"
          />
          <TextField
            label="Web Address / URL"
            fullWidth
            size="small"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://foryourgoal.com or mailto:info@foryourgoal.com"
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
            Insert Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Insert Image Sub-Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Insert Image or Logo</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <DialogContentText variant="body2">
            Upload an image or enter a direct public image URL to embed into your signature:
          </DialogContentText>

          {/* Option 1: Upload Image */}
          <Box
            sx={{
              p: 2,
              border: '2px dashed #cbd5e1',
              borderRadius: '16px',
              textAlign: 'center',
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            }}
          >
            <input
              type="file"
              ref={sigImageInputRef}
              hidden
              accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
              onChange={handleSigImageUpload}
            />
            <Button
              variant="outlined"
              size="small"
              disabled={imageUploadLoading}
              onClick={() => sigImageInputRef.current?.click()}
              startIcon={imageUploadLoading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
              sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 600 }}
            >
              {imageUploadLoading ? 'Uploading...' : 'Upload Image from Computer'}
            </Button>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 1 }}>
              Max size 5MB (PNG, JPG, SVG, WebP)
            </Typography>
          </Box>

          <Divider>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              OR
            </Typography>
          </Divider>

          {/* Option 2: Image URL */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Public Image URL"
              fullWidth
              size="small"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://foryourgoal.com/images/foryourgoal-logo.png"
            />
            <Button
              variant="contained"
              size="small"
              disabled={!imageUrl}
              onClick={handleInsertImageUrl}
              sx={{ borderRadius: '16px', alignSelf: 'flex-end', backgroundColor: '#0284c7' }}
            >
              Embed Image URL
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setImageDialogOpen(false)} sx={{ borderRadius: '16px' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
