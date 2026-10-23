'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import ReplyAllIcon from '@mui/icons-material/ReplyAll';
import ForwardOutlinedIcon from '@mui/icons-material/ForwardOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import CrmSidebar from '@/components/CrmSidebar';
import { Deal, Pipeline } from '@/lib/crm';
import { TrackingRecord } from '@/lib/tracking';
import { EmailHeader, FolderInfo } from '@/lib/imap';

interface EmailDetail extends EmailHeader {
  html: string;
  text: string;
  attachments?: {
    filename: string;
    contentType: string;
    size: number;
    partId: string;
  }[];
  cc?: { name: string; address: string }[];
  headers?: {
    spf?: string;
    dkim?: string;
    dmarc?: string;
    messageId?: string;
    date?: string;
    returnPath?: string;
  };
  rawHeaders?: string;
}

interface MailReaderProps {
  message: EmailHeader;
  detail: EmailDetail | null;
  loading: boolean;
  onBack: () => void;
  onAction: (action: string, uids: number[], targetFolder?: string) => void;
  onReply: (quote?: string) => void;
  onReplyAll?: () => void;
  onForward: () => void;
  currentFolder?: string;
  folders?: FolderInfo[];
}

export default function MailReader({
  message,
  detail,
  loading,
  onBack,
  onAction,
  onReply,
  onReplyAll,
  onForward,
  currentFolder = 'INBOX',
  folders = [],
}: MailReaderProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const [moveAnchor, setMoveAnchor] = useState<null | HTMLElement>(null);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [snoozeAnchor, setSnoozeAnchor] = useState<null | HTMLElement>(null);
  const [showExternalImages, setShowExternalImages] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('webmail_always_load_images');
        return stored !== 'false';
      } catch (e) {
        return true;
      }
    }
    return true;
  });

  useEffect(() => {
    const handleSettingsChanged = () => {
      try {
        const stored = localStorage.getItem('webmail_always_load_images');
        setShowExternalImages(stored !== 'false');
      } catch (e) {}
    };

    window.addEventListener('webmail_settings_changed', handleSettingsChanged);
    window.addEventListener('storage', handleSettingsChanged);

    return () => {
      window.removeEventListener('webmail_settings_changed', handleSettingsChanged);
      window.removeEventListener('storage', handleSettingsChanged);
    };
  }, []);
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'accepted' | 'maybe' | 'declined'>('none');
  const [blockedSenders, setBlockedSenders] = useState<string[]>([]);

  // Streak Email Tracking state
  const [trackingRecord, setTrackingRecord] = useState<TrackingRecord | null>(null);
  const [trackingTimelineOpen, setTrackingTimelineOpen] = useState(false);

  // CRM Deal and Pipeline state
  const [deal, setDeal] = useState<Deal | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [crmDrawerOpen, setCrmDrawerOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealValue, setNewDealValue] = useState('0');
  const [newDealPipelineId, setNewDealPipelineId] = useState('');
  const [newDealStageId, setNewDealStageId] = useState('');

  const isSent =
    currentFolder.toLowerCase().includes('sent') || currentFolder.toUpperCase() === 'SENT';

  // Fetch tracking record for this message
  useEffect(() => {
    fetch('/api/tracking')
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.records)) {
          const recs: TrackingRecord[] = data.records;
          let match: TrackingRecord | undefined;
          if (message.messageId) {
            const cleanMid = message.messageId.replace(/[<>]/g, '').trim();
            match = recs.find(
              (r) => r.messageId && r.messageId.replace(/[<>]/g, '').trim() === cleanMid
            );
          }
          if (!match && message.subject) {
            const cleanSub = message.subject.replace(/^(re|fwd|fw):\s*/i, '').trim().toLowerCase();
            match = recs.find((r) => {
              const rSub = (r.subject || '').replace(/^(re|fwd|fw):\s*/i, '').trim().toLowerCase();
              return rSub === cleanSub;
            });
          }
          if (match) {
            setTrackingRecord(match);
          }
        }
      })
      .catch(() => {});
  }, [message]);

  // Fetch pipelines & check if email is linked to a CRM deal
  useEffect(() => {
    fetch('/api/crm/pipelines')
      .then((r) => r.json())
      .then((data) => {
        if (data.pipelines) {
          setPipelines(data.pipelines);
          if (data.pipelines[0]) {
            setNewDealPipelineId(data.pipelines[0].id);
            setNewDealStageId(data.pipelines[0].stages[0]?.id || 'lead');
          }
        }
      })
      .catch(() => {});

    const contactEmail = message.from[0]?.address || '';
    const mid = message.messageId || '';
    const sub = message.subject || '';

    fetch(
      `/api/crm/deals?messageId=${encodeURIComponent(mid)}&contactEmail=${encodeURIComponent(contactEmail)}&subject=${encodeURIComponent(sub)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.deal) {
          setDeal(data.deal);
        } else {
          setDeal(null);
        }
      })
      .catch(() => {});
  }, [message]);

  const activePipeline =
    pipelines.find((p) => p.id === deal?.pipelineId) ||
    pipelines[0] ||
    null;

  // Load blocked senders
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('foryourgoal_blocked_senders');
        if (stored) setBlockedSenders(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleBlockSender = () => {
    if (!senderEmail) return;
    const updated = [...blockedSenders, senderEmail.toLowerCase()];
    setBlockedSenders(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('foryourgoal_blocked_senders', JSON.stringify(updated));
    }
    setMoreAnchor(null);
    onAction('spam', [message.uid]);
    alert(`Blocked ${senderEmail}. The conversation has been moved to Spam.`);
    onBack();
  };

  const handleSnooze = (label: string) => {
    setSnoozeAnchor(null);
    alert(`Conversation snoozed until ${label}`);
    onBack();
  };

  const sender = message.from[0]?.name || message.from[0]?.address || 'Unknown';
  const senderEmail = message.from[0]?.address || '';

  const smartReplies = [
    'Received with thanks, looking forward to it!',
    'I will review this and update you shortly.',
    'Thank you for confirming. Noted!',
  ];

  const handlePrint = () => {
    const subject = message.subject || '(no subject)';
    const from = message.from.map((f) => (f.name ? `${f.name} <${f.address}>` : f.address)).join(', ');
    const to = message.to.map((t) => (t.name ? `${t.name} <${t.address}>` : t.address)).join(', ');
    const date = new Date(message.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });
    const body = detail?.html || `<pre style="white-space:pre-wrap;font-family:inherit">${detail?.text || message.snippet || ''}</pre>`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subject}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#222;}h2{margin-bottom:4px;}.meta{color:#555;font-size:0.9rem;margin-bottom:16px;border-bottom:1px solid #ddd;padding-bottom:12px;}.meta span{display:block;margin-bottom:4px;}@media print{body{padding:0;}}</style>
</head><body>
<h2>${subject}</h2>
<div class="meta">
<span><strong>From:</strong> ${from}</span>
<span><strong>To:</strong> ${to}</span>
<span><strong>Date:</strong> ${date}</span>
</div>
<div>${body}</div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadEml = () => {
    window.open(
      `/api/mail/message/${message.uid}/raw?folder=${encodeURIComponent(currentFolder)}`,
      '_blank'
    );
  };

  const spfStatus = detail?.headers?.spf || 'unknown';
  const dkimStatus = detail?.headers?.dkim || 'unknown';
  const dmarcStatus = detail?.headers?.dmarc || 'unknown';

  const getAuthChipColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    if (status === 'pass') return 'success';
    if (status === 'fail') return 'error';
    if (status === 'softfail' || status === 'neutral') return 'warning';
    return 'default';
  };

  const movableFolders = folders.filter((f) => f.path !== currentFolder);

  const handleStageChange = async (newStageId: string) => {
    if (!deal) return;
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: newStageId }),
      });
      const data = await res.json();
      if (data.deal) setDeal(data.deal);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDealSubmit = async () => {
    if (!newDealTitle.trim()) return;
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDealTitle.trim(),
          pipelineId: newDealPipelineId || pipelines[0]?.id || 'sales_leads',
          stageId: newDealStageId || pipelines[0]?.stages[0]?.id || 'lead',
          contactEmail: message.from[0]?.address || '',
          contactName: message.from[0]?.name || '',
          dealValue: parseFloat(newDealValue) || 0,
          messageId: message.messageId || '',
        }),
      });
      const data = await res.json();
      if (data.deal) {
        setDeal(data.deal);
        setAddDealOpen(false);
        setCrmDrawerOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Action Toolbar */}
      <Box
        sx={{
          height: 48,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Back to inbox (Esc)">
            <IconButton onClick={onBack} size="small" sx={{ color: theme.palette.text.secondary }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

          <Tooltip title="Archive">
            <IconButton
              onClick={() => onAction('archive', [message.uid])}
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <ArchiveOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              onClick={() => onAction('delete', [message.uid])}
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mark as unread">
            <IconButton
              onClick={() => onAction('markUnread', [message.uid])}
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <MarkEmailUnreadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Snooze Button */}
          <Tooltip title="Snooze">
            <IconButton
              size="small"
              onClick={(e) => setSnoozeAnchor(e.currentTarget)}
              id="reader-snooze-button"
              sx={{ color: theme.palette.text.secondary }}
            >
              <AccessTimeOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={snoozeAnchor}
            open={Boolean(snoozeAnchor)}
            onClose={() => setSnoozeAnchor(null)}
            PaperProps={{ sx: { borderRadius: '12px', minWidth: 200 } }}
          >
            <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 600, color: 'text.secondary' }}>
              SNOOZE UNTIL...
            </Typography>
            <Divider sx={{ mb: 0.5 }} />
            <MenuItem onClick={() => handleSnooze('Later today (6:00 PM)')} sx={{ borderRadius: '8px', mx: 0.5 }}>
              <ListItemIcon><AccessTimeOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Later today" secondary="6:00 PM" />
            </MenuItem>
            <MenuItem onClick={() => handleSnooze('Tomorrow (8:00 AM)')} sx={{ borderRadius: '8px', mx: 0.5 }}>
              <ListItemIcon><AccessTimeOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Tomorrow" secondary="8:00 AM" />
            </MenuItem>
            <MenuItem onClick={() => handleSnooze('This weekend')} sx={{ borderRadius: '8px', mx: 0.5 }}>
              <ListItemIcon><AccessTimeOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="This weekend" secondary="Saturday 9:00 AM" />
            </MenuItem>
            <MenuItem onClick={() => handleSnooze('Next week')} sx={{ borderRadius: '8px', mx: 0.5 }}>
              <ListItemIcon><AccessTimeOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Next week" secondary="Monday 8:00 AM" />
            </MenuItem>
          </Menu>


          {/* Move to folder */}
          <Tooltip title="Move to folder">
            <IconButton
              size="small"
              onClick={(e) => setMoveAnchor(e.currentTarget)}
              sx={{ color: theme.palette.text.secondary }}
            >
              <DriveFileMoveOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={moveAnchor}
            open={Boolean(moveAnchor)}
            onClose={() => setMoveAnchor(null)}
            PaperProps={{ sx: { borderRadius: '12px', minWidth: 200, maxHeight: 320 } }}
          >
            {movableFolders.length === 0 ? (
              <MenuItem disabled>No other folders</MenuItem>
            ) : (
              movableFolders.map((f) => (
                <MenuItem
                  key={f.path}
                  onClick={() => {
                    setMoveAnchor(null);
                    onAction('move', [message.uid], f.path);
                  }}
                  sx={{ borderRadius: '8px', mx: 0.5 }}
                >
                  <ListItemIcon>
                    <FolderOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={f.name} />
                </MenuItem>
              ))
            )}
          </Menu>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant={crmDrawerOpen ? 'contained' : 'outlined'}
            onClick={() => setCrmDrawerOpen(!crmDrawerOpen)}
            startIcon={<WorkOutlineIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              color: crmDrawerOpen ? '#fff' : '#f97316',
              borderColor: '#f97316',
              backgroundColor: crmDrawerOpen ? '#f97316' : 'transparent',
              '&:hover': {
                backgroundColor: crmDrawerOpen ? '#ea580c' : 'rgba(249, 115, 22, 0.08)',
                borderColor: '#ea580c',
              },
            }}
          >
            {deal ? 'Streak CRM' : '+ Streak'}
          </Button>

          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint} sx={{ color: theme.palette.text.secondary }}>
              <PrintOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="More options">
            <IconButton
              size="small"
              onClick={(e) => setMoreAnchor(e.currentTarget)}
              sx={{ color: theme.palette.text.secondary }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={moreAnchor}
            open={Boolean(moreAnchor)}
            onClose={() => setMoreAnchor(null)}
            PaperProps={{ sx: { borderRadius: '12px', minWidth: 200 } }}
          >
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                handleDownloadEml();
              }}
              sx={{ borderRadius: '8px', mx: 0.5 }}
            >
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Download .eml" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                setSecurityOpen(true);
              }}
              sx={{ borderRadius: '8px', mx: 0.5 }}
            >
              <ListItemIcon>
                <ShieldOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="View Security Details" />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={handleBlockSender}
              id="reader-block-sender-item"
              sx={{ borderRadius: '8px', mx: 0.5, color: theme.palette.error.main }}
            >
              <ListItemIcon>
                <BlockOutlinedIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary={`Block ${sender}`} />
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Main Content & CRM Drawer Container */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Message Content Container */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 2, sm: 4 },
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {/* Streak Email Tracking Summary Bar */}
          {(isSent || trackingRecord) && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: '12px',
                bgcolor:
                  trackingRecord && trackingRecord.openCount > 0
                    ? isDark
                      ? 'rgba(22, 163, 74, 0.12)'
                      : '#f0fdf4'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : '#f8fafd',
                border: `1px solid ${
                  trackingRecord && trackingRecord.openCount > 0
                    ? 'rgba(22, 163, 74, 0.3)'
                    : theme.palette.divider
                }`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <VisibilityIcon
                    sx={{
                      color:
                        trackingRecord && trackingRecord.openCount > 0
                          ? '#16a34a'
                          : theme.palette.text.secondary,
                      fontSize: 22,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color:
                          trackingRecord && trackingRecord.openCount > 0
                            ? '#16a34a'
                            : theme.palette.text.secondary,
                      }}
                    >
                      {trackingRecord && trackingRecord.openCount > 0
                        ? `Streak Tracked: Read ${trackingRecord.openCount} time${
                            trackingRecord.openCount > 1 ? 's' : ''
                          }`
                        : 'Streak Tracked: Not opened yet'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                      {trackingRecord?.firstOpenedAt ? (
                        <>
                          First read:{' '}
                          {new Date(trackingRecord.firstOpenedAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {trackingRecord.lastOpenedAt &&
                            trackingRecord.lastOpenedAt !== trackingRecord.firstOpenedAt && (
                              <>
                                {' '}
                                • Last read:{' '}
                                {new Date(trackingRecord.lastOpenedAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </>
                            )}
                        </>
                      ) : (
                        'Awaiting recipient to open this email'
                      )}
                    </Typography>
                  </Box>
                </Box>
                {trackingRecord && trackingRecord.opens && trackingRecord.opens.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => setTrackingTimelineOpen(!trackingTimelineOpen)}
                    endIcon={trackingTimelineOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    sx={{ textTransform: 'none', color: '#16a34a', fontWeight: 600 }}
                  >
                    {trackingTimelineOpen ? 'Hide History' : `View Opens (${trackingRecord.opens.length})`}
                  </Button>
                )}
              </Box>

              {/* Expandable Open Event Timeline */}
              {trackingTimelineOpen && trackingRecord && trackingRecord.opens && (
                <Box
                  sx={{
                    mt: 2,
                    pt: 1.5,
                    borderTop: `1px solid ${
                      isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                    }`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}
                  >
                    OPEN EVENTS TIMELINE:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {trackingRecord.opens.map((evt, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          borderRadius: '6px',
                          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                          fontSize: '0.75rem',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16a34a' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {new Date(evt.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {evt.ip ? `IP: ${evt.ip}` : 'Direct'}
                          {evt.userAgent && ` • ${evt.userAgent.split(' ')[0]}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Streak CRM Deal / Box Bar */}
          <Box
            sx={{
              mb: 3,
              p: 1.5,
              borderRadius: '12px',
              border: `1px solid ${deal ? 'rgba(249, 115, 22, 0.4)' : theme.palette.divider}`,
              bgcolor: deal
                ? isDark
                  ? 'rgba(249, 115, 22, 0.08)'
                  : '#fff7ed'
                : isDark
                ? 'rgba(255, 255, 255, 0.02)'
                : 'rgba(0, 0, 0, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            {deal ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <WorkOutlineIcon sx={{ color: '#f97316', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f97316' }}>
                      {activePipeline?.name || 'Pipeline'}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {deal.title}
                    </Typography>
                  </Box>

                  {/* 1-click Stage Dropdown */}
                  <Select
                    size="small"
                    value={deal.stageId || activePipeline?.stages[0]?.id || ''}
                    onChange={(e) => handleStageChange(e.target.value)}
                    sx={{
                      height: 30,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      borderRadius: '16px',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                    }}
                  >
                    {activePipeline?.stages.map((st) => (
                      <MenuItem key={st.id} value={st.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: st.color }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {st.name}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>

                  {/* Deal Value Chip */}
                  <Chip
                    size="small"
                    label={`$${(deal.dealValue || 0).toLocaleString()}`}
                    sx={{
                      fontWeight: 700,
                      bgcolor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7',
                      color: isDark ? '#4ade80' : '#15803d',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                </Box>

                <Button
                  size="small"
                  onClick={() => setCrmDrawerOpen(!crmDrawerOpen)}
                  startIcon={<ViewSidebarOutlinedIcon sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: 'none', color: '#f97316', fontWeight: 600, fontSize: '0.8125rem' }}
                >
                  {crmDrawerOpen ? 'Close CRM Drawer' : 'Open CRM Drawer'}
                </Button>
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkOutlineIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Not tracked in any sales pipeline.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewDealTitle(message.subject || '');
                    setNewDealValue('0');
                    setAddDealOpen(true);
                  }}
                  sx={{
                    bgcolor: '#f97316',
                    '&:hover': { bgcolor: '#ea580c' },
                    textTransform: 'none',
                    borderRadius: '16px',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    py: 0.3,
                  }}
                >
                  + Add to Pipeline
                </Button>
              </>
            )}
          </Box>
        {/* Subject Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 500,
              fontSize: '1.375rem',
              color: theme.palette.text.primary,
              letterSpacing: '-0.2px',
              wordBreak: 'break-word',
            }}
          >
            {message.subject || '(no subject)'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={message.starred ? 'Starred' : 'Not starred'}>
              <IconButton
                size="small"
                onClick={() => onAction(message.starred ? 'unstar' : 'star', [message.uid])}
                sx={{ color: message.starred ? '#f4b400' : theme.palette.text.secondary }}
              >
                {message.starred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Sender Card */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {sender.charAt(0).toUpperCase()}
            </Avatar>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {sender}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  &lt;{senderEmail}&gt;
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                to me
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              {new Date(message.date).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Typography>
            <Tooltip title="Reply">
              <IconButton size="small" onClick={() => onReply()} sx={{ color: theme.palette.text.secondary }}>
                <ReplyOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Calendar Invite Card if .ics present */}
        {(detail?.attachments?.some(a => a.filename?.toLowerCase().endsWith('.ics') || a.contentType?.toLowerCase().includes('calendar')) || detail?.text?.includes('BEGIN:VCALENDAR')) && (
          <Paper
            variant="outlined"
            id="reader-calendar-card"
            sx={{
              p: 2,
              mb: 3,
              borderRadius: '12px',
              borderLeft: '4px solid #1a73e8',
              bgcolor: isDark ? 'rgba(26, 115, 232, 0.1)' : '#f8fafd',
              borderColor: isDark ? 'rgba(26, 115, 232, 0.3)' : '#d2e3fc',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <EventAvailableOutlinedIcon sx={{ color: '#1a73e8' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Calendar Meeting Invitation
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Subject: <strong>{message.subject || 'Meeting'}</strong> • Organizer: {sender} ({senderEmail})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant={rsvpStatus === 'accepted' ? 'contained' : 'outlined'}
                color="success"
                onClick={() => setRsvpStatus('accepted')}
                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                {rsvpStatus === 'accepted' ? '✓ Accepted' : 'Accept'}
              </Button>
              <Button
                size="small"
                variant={rsvpStatus === 'maybe' ? 'contained' : 'outlined'}
                color="warning"
                onClick={() => setRsvpStatus('maybe')}
                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                {rsvpStatus === 'maybe' ? '? Maybe' : 'Maybe'}
              </Button>
              <Button
                size="small"
                variant={rsvpStatus === 'declined' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => setRsvpStatus('declined')}
                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                {rsvpStatus === 'declined' ? '✗ Declined' : 'Decline'}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Remote Images Privacy Protection Banner */}
        {detail?.html && /<img[^>]+src=["']https?:\/\//i.test(detail.html) && !showExternalImages && (
          <Paper
            variant="outlined"
            id="reader-remote-images-banner"
            sx={{
              p: 1.5,
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(245, 124, 0, 0.1)' : '#fff8e1',
              borderColor: isDark ? 'rgba(245, 124, 0, 0.3)' : '#ffe082',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SecurityOutlinedIcon sx={{ color: '#f57c00' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  External images are blocked for your privacy
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Images can be used to track whether and when you opened this email.
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setShowExternalImages(true)}
              id="reader-display-images-btn"
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#f57c00', color: '#f57c00' }}
            >
              Display Images
            </Button>
          </Paper>
        )}

        {/* Email Body */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : (
          <Box sx={{ minHeight: 180, mb: 4 }}>
            {detail?.html ? (
              <Box
                component="div"
                dangerouslySetInnerHTML={{
                  __html: showExternalImages
                    ? detail.html
                    : detail.html.replace(
                        /<img([^>]+)src=(["']https?:\/\/[^"']+["'])/gi,
                        '<img$1data-blocked-src=$2 src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=="'
                      )
                }}
                sx={{
                  color: theme.palette.text.primary,
                  fontFamily: 'inherit',
                  '& a': { color: theme.palette.primary.main },
                  '& img': { maxWidth: '100%', height: 'auto' },
                  '& table': { maxWidth: '100%' },
                  bgcolor: isDark ? 'transparent' : 'inherit',
                }}
              />
            ) : (
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  color: theme.palette.text.primary,
                  lineHeight: 1.6,
                }}
              >
                {detail?.text || message.snippet || ''}
              </Typography>
            )}

            {/* Attachments Section */}
            {detail?.attachments && detail.attachments.length > 0 && (
              <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                  Attachments ({detail.attachments.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {detail.attachments.map((att, i) => (
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        borderRadius: '12px',
                        maxWidth: 260,
                        backgroundColor: isDark ? '#2b2d30' : '#f8fafd',
                      }}
                    >
                      <AttachFileIcon sx={{ color: theme.palette.text.secondary }} />
                      <Box sx={{ overflow: 'hidden', flex: 1 }}>
                        <Typography noWrap variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                          {att.filename}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {(att.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() =>
                            window.open(
                              `/api/mail/message/${message.uid}/attachment/${i}?folder=${encodeURIComponent(currentFolder)}`,
                              '_blank'
                            )
                          }
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* AI Smart Reply Suggestions */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AutoAwesomeIcon sx={{ fontSize: 18, color: '#fbbc05' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
              Suggested Smart Replies
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {smartReplies.map((reply, idx) => (
              <Chip
                key={idx}
                label={reply}
                onClick={() => onReply(reply)}
                clickable
                variant="outlined"
                sx={{
                  borderRadius: '18px',
                  py: 2,
                  px: 0.5,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderColor: isDark ? '#444746' : '#c2e7ff',
                  backgroundColor: isDark ? '#2b2d30' : '#f0f7ff',
                  color: isDark ? '#a8c7fa' : '#0b57d0',
                  '&:hover': {
                    backgroundColor: isDark ? '#3c4043' : '#e0f0ff',
                    borderColor: theme.palette.primary.main,
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Bottom Reply / Forward Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            variant="outlined"
            startIcon={<ReplyOutlinedIcon />}
            onClick={() => onReply()}
            sx={{
              borderRadius: '24px',
              px: 3,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: isDark ? '#303236' : '#f1f3f4',
              },
            }}
          >
            Reply
          </Button>
          {onReplyAll && (
            <Button
              variant="outlined"
              startIcon={<ReplyAllIcon />}
              onClick={onReplyAll}
              sx={{
                borderRadius: '24px',
                px: 3,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: isDark ? '#303236' : '#f1f3f4',
                },
              }}
            >
              Reply All
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<ForwardOutlinedIcon />}
            onClick={onForward}
            sx={{
              borderRadius: '24px',
              px: 3,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: isDark ? '#303236' : '#f1f3f4',
              },
            }}
          >
            Forward
          </Button>
        </Box>
      </Box>

      {/* Streak CRM Sidebar Drawer */}
      <CrmSidebar
        open={crmDrawerOpen}
        onClose={() => setCrmDrawerOpen(false)}
        deal={deal}
        pipeline={activePipeline}
        trackingRecord={trackingRecord}
        onUpdateDeal={(updated) => setDeal(updated)}
        onCreateDeal={() => {
          setNewDealTitle(message.subject || '');
          setNewDealValue('0');
          setAddDealOpen(true);
        }}
      />
    </Box>

      {/* Add Deal Dialog */}
      <Dialog
        open={addDealOpen}
        onClose={() => setAddDealOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkOutlineIcon sx={{ color: '#f97316' }} />
          Add to Streak CRM Pipeline
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              size="small"
              label="Deal / Box Title"
              fullWidth
              value={newDealTitle}
              onChange={(e) => setNewDealTitle(e.target.value)}
            />
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block', mb: 0.5 }}>
                Pipeline
              </Typography>
              <Select
                size="small"
                fullWidth
                value={newDealPipelineId || pipelines[0]?.id || ''}
                onChange={(e) => {
                  const pid = e.target.value;
                  setNewDealPipelineId(pid);
                  const p = pipelines.find((item) => item.id === pid);
                  if (p && p.stages[0]) setNewDealStageId(p.stages[0].id);
                }}
              >
                {pipelines.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block', mb: 0.5 }}>
                Stage
              </Typography>
              <Select
                size="small"
                fullWidth
                value={newDealStageId || activePipeline?.stages[0]?.id || ''}
                onChange={(e) => setNewDealStageId(e.target.value)}
              >
                {(pipelines.find((p) => p.id === newDealPipelineId)?.stages || activePipeline?.stages || []).map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: st.color }} />
                      <Typography variant="body2">{st.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <TextField
              size="small"
              label="Deal Value ($ USD)"
              type="number"
              fullWidth
              value={newDealValue}
              onChange={(e) => setNewDealValue(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDealOpen(false)} sx={{ borderRadius: '16px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateDealSubmit}
            variant="contained"
            sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, borderRadius: '16px' }}
          >
            Create Box
          </Button>
        </DialogActions>
      </Dialog>

      {/* Security Details Dialog */}
      <Dialog
        open={securityOpen}
        onClose={() => setSecurityOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldOutlinedIcon sx={{ color: theme.palette.primary.main }} />
          Security & Authentication Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
            <Chip
              label={`SPF: ${spfStatus}`}
              color={getAuthChipColor(spfStatus)}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
            />
            <Chip
              label={`DKIM: ${dkimStatus}`}
              color={getAuthChipColor(dkimStatus)}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
            />
            <Chip
              label={`DMARC: ${dmarcStatus}`}
              color={getAuthChipColor(dmarcStatus)}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
            />
          </Box>
          {(detail?.rawHeaders || detail?.headers?.messageId) && (
            <Box
              sx={{
                bgcolor: isDark ? '#1e1e1e' : '#f5f5f5',
                borderRadius: '8px',
                p: 2,
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              <Typography
                component="pre"
                sx={{
                  fontSize: '0.72rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  color: theme.palette.text.primary,
                  m: 0,
                }}
              >
                {detail?.rawHeaders || `Message-ID: ${detail?.headers?.messageId || ''}`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSecurityOpen(false)} variant="contained" sx={{ borderRadius: '16px' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
