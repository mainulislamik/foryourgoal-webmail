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
import RecipientChipInput from './RecipientChipInput';
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
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';


const CANNED_TEMPLATES = [
  {
    title: 'Project Proposal Follow-up',
    subject: 'Follow-up: Project Discussion & Next Milestones',
    body: 'Dear Client,<br><br>Thank you for our productive conversation earlier. Following up on the discussed items, please review the proposed scope, technical architecture, and timelines.<br><br>We look forward to your valuable feedback.<br><br>Best regards,<br><b>ForYourGoal Team</b>',
  },
  {
    title: 'Invoice Due Reminder',
    subject: 'Friendly Reminder: Invoice Payment Due',
    body: 'Dear Client,<br><br>This is a polite reminder that payment for the recent milestone is scheduled. Please find the details attached.<br><br>If already settled, please ignore this notice.<br><br>Warm regards,<br><b>ForYourGoal Accounts</b>',
  },
  {
    title: 'Meeting Confirmation',
    subject: 'Confirmed: Meeting Schedule & Video Link',
    body: 'Hi there,<br><br>This is to confirm our meeting. We have reserved the calendar slot and look forward to discussing the project deliverables.<br><br>Google Meet / Teams link will be active 5 minutes prior.<br><br>Best regards,<br><b>ForYourGoal Team</b>',
  },
  {
    title: 'Client Onboarding Welcome',
    subject: 'Welcome to ForYourGoal — Getting Started',
    body: 'Dear Partner,<br><br>Welcome aboard! We are thrilled to partner with you. Our engineering team is currently provisioning your workspace and dedicated resources.<br><br>Feel free to reach out anytime.<br><br>Sincerely,<br><b>ForYourGoal Operations</b>',
  },
];

interface ComposeState {
  open: boolean;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}

export interface EmailTemplateItem {
  id: string;
  userEmail: string;
  title: string;
  subject: string;
  bodyHtml: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
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
    trackEmail?: boolean;
  }) => void;
  signature?: string;
  onOpenSettings?: () => void;
  user?: { email: string; displayName?: string; avatarUrl?: string } | null;
}

export default function DockedCompose({
  state,
  onClose,
  onSend,
  signature = '',
  onOpenSettings,
  user,
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

  // Streak Email Tracking toggle (default ON)
  const [trackEmail, setTrackEmail] = useState<boolean>(true);

  // Dynamic Email Templates state
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateAnchor, setTemplateAnchor] = useState<null | HTMLElement>(null);

  // Template Save Dialog
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplateTitle, setSaveTemplateTitle] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Manage Templates Modal
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [isNewTemplateInManage, setIsNewTemplateInManage] = useState(false);
  const [savingEditTemplate, setSavingEditTemplate] = useState(false);

  // Priority & Delivery receipts
  const [priority, setPriority] = useState<'high' | 'normal'>('normal');
  const [requestReceipt, setRequestReceipt] = useState(false);

  // Attachments & uploads
  const [attachments, setAttachments] = useState<
    Array<{ filename: string; content: string; contentType: string; size: number }>
  >([]);
  const fileAttachmentInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Scheduled Send
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [sendMenuAnchor, setSendMenuAnchor] = useState<null | HTMLElement>(null);

  // Link Dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Auto-save draft indicator
  const [draftSavedText, setDraftSavedText] = useState('');

  // Fetch templates from API
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.templates)) {
          setTemplates(data.templates);
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Placeholders replacer for templates
  const replacePlaceholders = (text: string) => {
    const recipientEmail = to.trim();
    const recipientName = recipientEmail.includes('@')
      ? recipientEmail.split('@')[0]
      : recipientEmail || 'Friend';
    const senderName = user?.displayName || user?.email?.split('@')[0] || 'Me';
    const senderEmail = user?.email || '';
    const dateFormatted = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return text
      .replace(/\{\{recipient_name\}\}/gi, recipientName)
      .replace(/\{\{recipient_email\}\}/gi, recipientEmail)
      .replace(/\{\{sender_name\}\}/gi, senderName)
      .replace(/\{\{date\}\}/gi, dateFormatted);
  };

  // Insert template into compose
  const handleApplyTemplate = (tmpl: { title: string; subject: string; bodyHtml?: string; body?: string }) => {
    const rawBody = tmpl.bodyHtml || tmpl.body || '';
    if (!subject.trim() && tmpl.subject) {
      setSubject(replacePlaceholders(tmpl.subject));
    }
    const processedBody = replacePlaceholders(rawBody);

    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML || '';
      const quoteIndex = currentHtml.indexOf('<div style="border-left: 2px solid');
      const fwdIndex = currentHtml.indexOf('---------- Forwarded message ---------');
      const sigIndex = currentHtml.indexOf('data-fyg-signature');

      if (quoteIndex !== -1) {
        const quotePart = currentHtml.substring(quoteIndex);
        editorRef.current.innerHTML = `${processedBody}<br><br>${quotePart}`;
      } else if (fwdIndex !== -1) {
        editorRef.current.innerHTML = `${processedBody}<br><br>${currentHtml}`;
      } else if (sigIndex !== -1) {
        const sigContainerStart = currentHtml.lastIndexOf('<div data-fyg-signature="true">');
        if (sigContainerStart !== -1) {
          const sigPart = currentHtml.substring(sigContainerStart);
          editorRef.current.innerHTML = `${processedBody}<br>${sigPart}`;
        } else {
          editorRef.current.innerHTML = `${processedBody}<br><br>${signature ? `<div data-fyg-signature="true"><br><br>${signature}</div>` : ''}`;
        }
      } else {
        const sigBlock = signature ? `<div data-fyg-signature="true"><br><br>${signature}</div>` : '';
        editorRef.current.innerHTML = processedBody + sigBlock;
      }
    }
    setTemplateAnchor(null);
  };

  // Save current draft as a new template
  const handleSaveDraftAsTemplate = async () => {
    if (!saveTemplateTitle.trim()) {
      alert('Please enter a title for this template');
      return;
    }
    setSavingTemplate(true);
    try {
      const htmlContent = editorRef.current?.innerHTML || '';
      let cleanBody = htmlContent;
      const sigIndex = cleanBody.indexOf('<div data-fyg-signature="true">');
      if (sigIndex !== -1) {
        cleanBody = cleanBody.substring(0, sigIndex);
      }
      const quoteIndex = cleanBody.indexOf('<div style="border-left: 2px solid');
      if (quoteIndex !== -1) {
        cleanBody = cleanBody.substring(0, quoteIndex);
      }

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: saveTemplateTitle.trim(),
          subject: subject.trim(),
          bodyHtml: cleanBody.trim() || htmlContent,
        }),
      });

      if (res.ok) {
        await fetchTemplates();
        setSaveTemplateOpen(false);
        setSaveTemplateTitle('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save template');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Manage templates handlers
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchTemplates();
        if (editingTemplate?.id === id) {
          setEditingTemplate(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleSaveEditedTemplate = async () => {
    if (!editTitle.trim()) {
      alert('Please enter a template title');
      return;
    }
    setSavingEditTemplate(true);
    try {
      if (isNewTemplateInManage) {
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle.trim(),
            subject: editSubject.trim(),
            bodyHtml: editBody.trim(),
          }),
        });
        if (res.ok) {
          await fetchTemplates();
          setEditingTemplate(null);
          setIsNewTemplateInManage(false);
        }
      } else if (editingTemplate) {
        const res = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle.trim(),
            subject: editSubject.trim(),
            bodyHtml: editBody.trim(),
          }),
        });
        if (res.ok) {
          await fetchTemplates();
          setEditingTemplate(null);
        }
      }
    } catch (err) {
      console.error('Failed to save edited template:', err);
    } finally {
      setSavingEditTemplate(false);
    }
  };

  const handleScheduleSendSubmit = () => {
    if (!scheduleDateTime) {
      alert('Please select date and time');
      return;
    }
    const htmlContent = editorRef.current?.innerHTML || '';
    // Store in scheduled emails
    try {
      const existing = JSON.parse(localStorage.getItem('foryourgoal_scheduled_emails') || '[]');
      existing.push({
        id: Date.now(),
        to,
        cc: showCc && cc.trim() ? cc.trim() : undefined,
        bcc: showBcc && bcc.trim() ? bcc.trim() : undefined,
        subject,
        body: htmlContent,
        scheduledAt: scheduleDateTime,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('foryourgoal_scheduled_emails', JSON.stringify(existing));
      alert(`Email scheduled to be sent on ${new Date(scheduleDateTime).toLocaleString()}!`);
      onClose();
    } catch (e) {
      console.error(e);
    }
    setScheduleDialogOpen(false);
  };

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

  // Undo Send state
  const [isSendingCountdown, setIsSendingCountdown] = useState(false);
  const [sendCountdown, setSendCountdown] = useState(5);
  const sendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const executeSend = () => {
    setIsSendingCountdown(false);
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);

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
      trackEmail,
    });
    // Clear draft upon sending
    if (typeof window !== 'undefined') {
      localStorage.removeItem('foryourgoal_webmail_draft');
    }
  };

  const handleSend = () => {
    if (!to.trim()) {
      alert('Please specify at least one recipient.');
      return;
    }
    setIsSendingCountdown(true);
    setSendCountdown(5);

    sendIntervalRef.current = setInterval(() => {
      setSendCountdown((prev) => {
        if (prev <= 1) {
          if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    sendTimerRef.current = setTimeout(() => {
      executeSend();
    }, 5000);
  };

  const handleUndoSend = () => {
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
    setIsSendingCountdown(false);
    setSendCountdown(5);
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
            {isSendingCountdown && (
              <Box
                id="compose-undo-send-banner"
                sx={{
                  mx: 2,
                  mt: 1,
                  p: 1.2,
                  bgcolor: isDark ? '#1e293b' : '#334155',
                  color: '#ffffff',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  animation: 'fadeIn 0.2s ease-in-out',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <CircularProgress size={16} sx={{ color: '#38bdf8' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Sending message in {sendCountdown}s...
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    id="compose-undo-button"
                    size="small"
                    variant="contained"
                    onClick={handleUndoSend}
                    sx={{
                      bgcolor: '#f59e0b',
                      color: '#000000',
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      py: 0.2,
                      px: 1.5,
                      borderRadius: '6px',
                      '&:hover': { bgcolor: '#d97706' },
                    }}
                  >
                    Undo
                  </Button>
                  <Button
                    id="compose-send-now-button"
                    size="small"
                    onClick={executeSend}
                    sx={{
                      color: '#cbd5e1',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      p: 0,
                      minWidth: 'auto',
                      '&:hover': { color: '#ffffff' },
                    }}
                  >
                    Send now
                  </Button>
                </Box>
              </Box>
            )}

            {/* From Row (Gmail Authentic) */}
            {user && (
              <Box
                sx={{
                  px: 2,
                  py: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, width: 44, fontWeight: 500, flexShrink: 0 }}>
                  From
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary, fontSize: '0.875rem' }}>
                    {user.displayName || user.email.split('@')[0]}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>
                    &lt;{user.email}&gt;
                  </Typography>
                  <ArrowDropDownIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, ml: -0.5 }} />
                </Box>
              </Box>
            )}

            {/* Recipients (To) Row */}
            <Box
              sx={{
                px: 2,
                py: 0.5,
                display: 'flex',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, width: 44, fontWeight: 500, flexShrink: 0 }}>
                To
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <RecipientChipInput
                  id="compose-to-input"
                  label="To"
                  value={to}
                  onChange={setTo}
                  placeholder="Recipients"
                />
              </Box>
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
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, width: 44, fontWeight: 500, flexShrink: 0 }}>
                  Cc
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <RecipientChipInput
                    id="compose-cc-input"
                    label="Cc"
                    value={cc}
                    onChange={setCc}
                    placeholder="Carbon copy recipients"
                    autoFocus
                  />
                </Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    setShowCc(false);
                    setCc('');
                  }}
                  title="Remove Cc"
                  sx={{ p: 0.5, color: theme.palette.text.secondary, ml: 1, flexShrink: 0 }}
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
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, width: 44, fontWeight: 500, flexShrink: 0 }}>
                  Bcc
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <RecipientChipInput
                    id="compose-bcc-input"
                    label="Bcc"
                    value={bcc}
                    onChange={setBcc}
                    placeholder="Blind carbon copy recipients"
                    autoFocus
                  />
                </Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    setShowBcc(false);
                    setBcc('');
                  }}
                  title="Remove Bcc"
                  sx={{ p: 0.5, color: theme.palette.text.secondary, ml: 1, flexShrink: 0 }}
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
                {/* Send Button & Schedule Split */}
                <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleSend}
                    id="compose-send-button"
                    sx={{
                      backgroundColor: '#0b57d0',
                      color: '#ffffff',
                      borderTopLeftRadius: '20px',
                      borderBottomLeftRadius: '20px',
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      px: 2.5,
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
                  <Button
                    variant="contained"
                    size="small"
                    onClick={(e) => setSendMenuAnchor(e.currentTarget)}
                    id="compose-send-dropdown"
                    sx={{
                      backgroundColor: '#0b57d0',
                      color: '#ffffff',
                      minWidth: '32px',
                      px: 0.5,
                      py: 0.8,
                      borderTopRightRadius: '20px',
                      borderBottomRightRadius: '20px',
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderLeft: '1px solid rgba(255,255,255,0.25)',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#0842a0',
                      },
                    }}
                  >
                    <ArrowDropDownIcon fontSize="small" />
                  </Button>
                </Box>

                <Menu
                  anchorEl={sendMenuAnchor}
                  open={Boolean(sendMenuAnchor)}
                  onClose={() => setSendMenuAnchor(null)}
                  PaperProps={{ sx: { borderRadius: '12px', minWidth: 180 } }}
                >
                  <MenuItem
                    onClick={() => {
                      setSendMenuAnchor(null);
                      setScheduleDialogOpen(true);
                    }}
                  >
                    <ListItemIcon>
                      <ScheduleSendIcon fontSize="small" sx={{ color: '#0b57d0' }} />
                    </ListItemIcon>
                    <ListItemText primary="Schedule send" secondary="Pick date & time" />
                  </MenuItem>
                </Menu>

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

                {/* Templates / Canned Responses */}
                <Tooltip title="Templates (Canned Responses)">
                  <IconButton
                    size="small"
                    onClick={(e) => setTemplateAnchor(e.currentTarget)}
                    id="compose-templates-button"
                    sx={{
                      color: theme.palette.text.secondary,
                      p: 0.6,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                    }}
                  >
                    <ArticleOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={templateAnchor}
                  open={Boolean(templateAnchor)}
                  onClose={() => setTemplateAnchor(null)}
                  PaperProps={{ sx: { borderRadius: '14px', width: 280, p: 0.5 } }}
                >
                  <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 600, color: theme.palette.text.secondary }}>
                    SAVED EMAIL TEMPLATES
                  </Typography>
                  <Divider sx={{ mb: 0.5 }} />
                  {CANNED_TEMPLATES.map((tmpl, idx) => (
                    <MenuItem key={idx} onClick={() => handleApplyTemplate(tmpl)} sx={{ borderRadius: '8px' }}>
                      <ListItemText
                        primary={tmpl.title}
                        secondary={tmpl.subject}
                        primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 600 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
                      />
                    </MenuItem>
                  ))}
                </Menu>

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

                {/* Templates Button */}
                <Tooltip title="Templates (Canned Responses)">
                  <IconButton
                    size="small"
                    onClick={(e) => setTemplateAnchor(e.currentTarget)}
                    id="compose-templates-button"
                    sx={{
                      color: templateAnchor ? '#0284c7' : theme.palette.text.secondary,
                      p: 0.5,
                      borderRadius: 1,
                      backgroundColor: templateAnchor ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
                    }}
                  >
                    <BookmarkBorderIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Streak Email Tracking Toggle */}
                <Tooltip title={trackEmail ? 'Email tracking is ON (Streak)' : 'Email tracking is OFF (Streak)'}>
                  <IconButton
                    size="small"
                    onClick={() => setTrackEmail((prev) => !prev)}
                    id="compose-track-email-button"
                    sx={{
                      color: trackEmail ? '#f97316' : theme.palette.text.secondary,
                      bgcolor: trackEmail ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
                      p: 0.5,
                      borderRadius: 1,
                      border: trackEmail ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid transparent',
                      '&:hover': {
                        bgcolor: trackEmail ? 'rgba(249, 115, 22, 0.2)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                      },
                    }}
                  >
                    {trackEmail ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                {/* Template Action Menu */}
                <Menu
                  anchorEl={templateAnchor}
                  open={Boolean(templateAnchor)}
                  onClose={() => setTemplateAnchor(null)}
                  PaperProps={{
                    sx: {
                      borderRadius: '16px',
                      minWidth: 260,
                      maxWidth: 360,
                      maxHeight: 450,
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
                  <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Email Templates
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Insert reusable canned responses
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', fontWeight: 600, color: 'text.secondary' }}>
                    INSERT TEMPLATE
                  </Typography>

                  {loadingTemplates ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : templates.length === 0 ? (
                    CANNED_TEMPLATES.map((tmpl, idx) => (
                      <MenuItem
                        key={`canned-${idx}`}
                        onClick={() => handleApplyTemplate(tmpl)}
                        sx={{ py: 1 }}
                      >
                        <ListItemIcon>
                          <ArticleOutlinedIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={tmpl.title}
                          secondary={tmpl.subject}
                          primaryTypographyProps={{ variant: 'body2', noWrap: true, fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                        />
                      </MenuItem>
                    ))
                  ) : (
                    templates.map((tmpl) => (
                      <MenuItem
                        key={tmpl.id}
                        onClick={() => handleApplyTemplate(tmpl)}
                        sx={{ py: 1 }}
                      >
                        <ListItemIcon>
                          <ArticleOutlinedIcon fontSize="small" sx={{ color: '#0284c7' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={tmpl.title}
                          secondary={tmpl.subject || '(no subject)'}
                          primaryTypographyProps={{ variant: 'body2', noWrap: true, fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                        />
                      </MenuItem>
                    ))
                  )}

                  <Divider sx={{ my: 0.5 }} />

                  <MenuItem
                    onClick={() => {
                      setTemplateAnchor(null);
                      setSaveTemplateTitle(subject ? `Template: ${subject}` : '');
                      setSaveTemplateOpen(true);
                    }}
                  >
                    <ListItemIcon>
                      <SaveAltIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Save draft as template..." />
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      setTemplateAnchor(null);
                      setEditingTemplate(null);
                      setIsNewTemplateInManage(false);
                      setManageTemplatesOpen(true);
                    }}
                  >
                    <ListItemIcon>
                      <SettingsOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Manage templates..." />
                  </MenuItem>
                </Menu>
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
      
      {/* Schedule Send Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', width: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleSendIcon color="primary" /> Schedule Send
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Specify the date and time when this email should be sent.
          </Typography>
          <TextField
            fullWidth
            type="datetime-local"
            label="Send Date & Time"
            InputLabelProps={{ shrink: true }}
            value={scheduleDateTime}
            onChange={(e) => setScheduleDateTime(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setScheduleDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleScheduleSendSubmit}
            sx={{ borderRadius: '12px', bgcolor: '#0b57d0' }}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Save Draft As Template Dialog */}
      <Dialog
        open={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SaveAltIcon color="primary" /> Save Draft as Template
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Save this current email subject and body as a reusable template. You can use placeholders like <code>{'{{recipient_name}}'}</code>, <code>{'{{sender_name}}'}</code>, <code>{'{{date}}'}</code>.
          </Typography>
          <TextField
            autoFocus
            label="Template Title"
            fullWidth
            size="small"
            value={saveTemplateTitle}
            onChange={(e) => setSaveTemplateTitle(e.target.value)}
            placeholder="e.g. Sales Intro, Follow-up"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSaveTemplateOpen(false)} sx={{ borderRadius: '16px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveDraftAsTemplate}
            variant="contained"
            disabled={savingTemplate || !saveTemplateTitle.trim()}
            sx={{ borderRadius: '16px', bgcolor: '#0284c7' }}
          >
            {savingTemplate ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Templates Dialog */}
      <Dialog
        open={manageTemplatesOpen}
        onClose={() => {
          setManageTemplatesOpen(false);
          setEditingTemplate(null);
          setIsNewTemplateInManage(false);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1, minHeight: 480 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookmarkBorderIcon color="primary" /> Manage Templates
          </Box>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={() => {
              setEditingTemplate({
                id: '',
                userEmail: '',
                title: '',
                subject: '',
                bodyHtml: '',
                createdAt: '',
                updatedAt: '',
              });
              setEditTitle('');
              setEditSubject('');
              setEditBody('');
              setIsNewTemplateInManage(true);
            }}
            sx={{ borderRadius: '16px' }}
          >
            New Template
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', gap: 2, p: 2 }}>
          {/* Templates list on left */}
          <Box sx={{ width: '40%', borderRight: '1px solid', borderColor: 'divider', pr: 2, overflowY: 'auto', maxHeight: 400 }}>
            {templates.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No custom templates yet. Click &quot;New Template&quot; or save your draft as a template.
              </Typography>
            ) : (
              templates.map((tmpl) => (
                <Box
                  key={tmpl.id}
                  onClick={() => {
                    setEditingTemplate(tmpl);
                    setEditTitle(tmpl.title);
                    setEditSubject(tmpl.subject);
                    setEditBody(tmpl.bodyHtml);
                    setIsNewTemplateInManage(false);
                  }}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    bgcolor: editingTemplate?.id === tmpl.id ? (isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.08)') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    border: '1px solid',
                    borderColor: editingTemplate?.id === tmpl.id ? '#0284c7' : 'divider',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                      {tmpl.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(tmpl.id);
                      }}
                      sx={{ color: '#ef4444', p: 0.2 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {tmpl.subject || '(no subject)'}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          {/* Edit form on right */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, pl: 1 }}>
            {editingTemplate ? (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {isNewTemplateInManage ? 'Create New Template' : `Edit Template: ${editingTemplate.title}`}
                </Typography>
                <TextField
                  label="Template Title"
                  fullWidth
                  size="small"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Follow up email"
                />
                <TextField
                  label="Default Subject"
                  fullWidth
                  size="small"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="e.g. Following up on {{recipient_name}}"
                />
                <TextField
                  label="Body (HTML or Text)"
                  fullWidth
                  multiline
                  rows={8}
                  size="small"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Hello {{recipient_name}}, ..."
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 'auto' }}>
                  <Button
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsNewTemplateInManage(false);
                    }}
                    color="inherit"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveEditedTemplate}
                    disabled={savingEditTemplate || !editTitle.trim()}
                    sx={{ borderRadius: '12px', bgcolor: '#0284c7' }}
                  >
                    {savingEditTemplate ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                <BookmarkBorderIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                <Typography variant="body2">
                  Select a template on the left to edit or click &quot;New Template&quot;.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setManageTemplatesOpen(false);
              setEditingTemplate(null);
              setIsNewTemplateInManage(false);
            }}
            sx={{ borderRadius: '16px' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
