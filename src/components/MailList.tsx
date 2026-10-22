'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { EmailHeader, FolderInfo } from '@/lib/imap';
import { useThemeMode } from '@/contexts/ThemeContext';

interface MailListProps {
  messages: EmailHeader[];
  loading: boolean;
  onSelectMessage: (msg: EmailHeader) => void;
  onRefresh: () => void;
  onAction: (action: string, uids: number[], targetFolder?: string) => void;
  focusedIndex?: number;
  currentFolder?: string;
  folders?: FolderInfo[];
}

export default function MailList({
  messages,
  loading,
  onSelectMessage,
  onRefresh,
  onAction,
  focusedIndex = -1,
  currentFolder = 'INBOX',
  folders = [],
}: MailListProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { density } = useThemeMode();

  const [selectedUids, setSelectedUids] = useState<number[]>([]);
  const [hoveredUid, setHoveredUid] = useState<number | null>(null);
  const [moveAnchor, setMoveAnchor] = useState<null | HTMLElement>(null);
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);

  // Streak Email Tracking state
  const [trackingRecords, setTrackingRecords] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/tracking')
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.records)) {
          setTrackingRecords(data.records);
        }
      })
      .catch(() => {});
  }, [currentFolder, messages]);

  const isSentFolder =
    currentFolder.toLowerCase().includes('sent') || currentFolder.toUpperCase() === 'SENT';

  const getTrackingForMessage = (msg: EmailHeader) => {
    if (!trackingRecords || trackingRecords.length === 0) return null;
    if (msg.messageId) {
      const cleanMid = msg.messageId.replace(/[<>]/g, '').trim();
      const match = trackingRecords.find(
        (r) => r.messageId && r.messageId.replace(/[<>]/g, '').trim() === cleanMid
      );
      if (match) return match;
    }
    const cleanSub = (msg.subject || '').replace(/^(re|fwd|fw):\s*/i, '').trim().toLowerCase();
    if (cleanSub) {
      const match = trackingRecords.find((r) => {
        const rSub = (r.subject || '').replace(/^(re|fwd|fw):\s*/i, '').trim().toLowerCase();
        return rSub === cleanSub;
      });
      if (match) return match;
    }
    return null;
  };

  // Compute row height and typography based on density
  const rowHeight = density === 'compact' ? 32 : density === 'comfortable' ? 48 : 40;
  const fontSize = density === 'compact' ? '0.8125rem' : density === 'comfortable' ? '0.9375rem' : '0.875rem';

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUids(messages.map((m) => m.uid));
    } else {
      setSelectedUids([]);
    }
  };

  const handleToggleSelect = (uid: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleToggleStar = (uid: number, isStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(isStarred ? 'unstar' : 'star', [uid]);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Group thread counts by normalized subject
  const threadCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const msg of messages) {
      const cleanSub = (msg.subject || '(no subject)')
        .toLowerCase()
        .replace(/^(re|fwd|fw):\s*/i, '')
        .trim();
      map.set(cleanSub, (map.get(cleanSub) || 0) + 1);
    }
    return map;
  }, [messages]);

  const getEmptyState = () => {
    const folder = (currentFolder || '').toLowerCase();
    if (folder.includes('sent')) {
      return {
        title: 'No sent messages',
        subtitle: 'Messages you send will appear here.',
      };
    }
    if (folder.includes('draft')) {
      return {
        title: 'No drafts',
        subtitle: 'Saved draft messages will appear here.',
      };
    }
    if (folder.includes('trash') || folder.includes('bin')) {
      return {
        title: 'Trash is empty',
        subtitle: 'Deleted messages will appear here.',
      };
    }
    if (folder.includes('spam') || folder.includes('junk')) {
      return {
        title: 'No spam messages',
        subtitle: 'Hooray, no spam here!',
      };
    }
    if (folder.includes('star')) {
      return {
        title: 'No starred messages',
        subtitle: 'Starred messages will appear here.',
      };
    }
    return {
      title: 'Your inbox is empty',
      subtitle: 'When you receive emails, they will appear here.',
    };
  };

  const emptyState = getEmptyState();

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Toolbar */}
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
          <Checkbox
            size="small"
            indeterminate={
              selectedUids.length > 0 && selectedUids.length < messages.length
            }
            checked={messages.length > 0 && selectedUids.length === messages.length}
            onChange={handleSelectAll}
            sx={{ color: theme.palette.text.secondary, p: 0.5 }}
          />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh} sx={{ color: theme.palette.text.secondary }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {selectedUids.length > 0 && (
            <>
              <Tooltip title="Archive">
                <IconButton
                  size="small"
                  onClick={() => onAction('archive', selectedUids)}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <ArchiveOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => onAction('delete', selectedUids)}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mark as read">
                <IconButton
                  size="small"
                  onClick={() => onAction('markRead', selectedUids)}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <MarkEmailReadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mark as unread">
                <IconButton
                  size="small"
                  onClick={() => onAction('markUnread', selectedUids)}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <MarkEmailUnreadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
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
                {folders.filter((f) => f.path !== currentFolder).length === 0 ? (
                  <MenuItem disabled>No other folders</MenuItem>
                ) : (
                  folders
                    .filter((f) => f.path !== currentFolder)
                    .map((f) => (
                      <MenuItem
                        key={f.path}
                        onClick={() => {
                          setMoveAnchor(null);
                          onAction('move', selectedUids, f.path);
                          setSelectedUids([]);
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
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {messages.length > 0 ? `1–${messages.length} of ${messages.length}` : '0 of 0'}
          </Typography>
        </Box>
      </Box>

      {/* Empty Trash/Spam Banner */}
      {(currentFolder.toUpperCase() === 'TRASH' ||
        currentFolder.toUpperCase() === 'SPAM' ||
        currentFolder.toUpperCase() === 'JUNK') &&
        messages.length > 0 && (
          <Box
            sx={{
              px: 3,
              py: 1,
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
              borderBottom: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" sx={{ color: isDark ? '#fca5a5' : '#b91c1c', fontWeight: 500 }}>
              Messages in {currentFolder} can be permanently deleted.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverOutlinedIcon />}
              onClick={() => setEmptyDialogOpen(true)}
              sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 600, py: 0.3 }}
            >
              Empty {currentFolder} now
            </Button>
          </Box>
        )}

      {/* Empty Confirmation Dialog */}
      <Dialog
        open={emptyDialogOpen}
        onClose={() => setEmptyDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Empty {currentFolder}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will permanently delete all messages in <strong>{currentFolder}</strong>. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEmptyDialogOpen(false)} sx={{ borderRadius: '16px' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setEmptyDialogOpen(false);
              onAction('empty-folder', []);
            }}
            variant="contained"
            color="error"
            sx={{ borderRadius: '16px' }}
          >
            Empty Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message List */}
      <Box sx={{ flex: 1, overflowY: 'auto', backgroundColor: theme.palette.background.paper }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, px: 2 }}>
            <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500, mb: 0.5 }}>
              {emptyState.title}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {emptyState.subtitle}
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => {
            const isSelected = selectedUids.includes(msg.uid);
            const isHovered = hoveredUid === msg.uid;
            const isFocused = focusedIndex === index;

            const cleanSub = (msg.subject || '(no subject)')
              .toLowerCase()
              .replace(/^(re|fwd|fw):\s*/i, '')
              .trim();
            const threadCount = threadCounts.get(cleanSub) || 1;

            return (
              <Box
                key={msg.uid}
                onClick={() => onSelectMessage(msg)}
                onMouseEnter={() => setHoveredUid(msg.uid)}
                onMouseLeave={() => setHoveredUid(null)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: rowHeight,
                  px: 2,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${isDark ? '#303236' : 'rgba(0,0,0,0.06)'}`,
                  backgroundColor: msg.unread
                    ? isDark
                      ? '#282a2c'
                      : '#ffffff'
                    : isSelected
                    ? isDark
                      ? '#004a77'
                      : '#c2e7ff'
                    : isDark
                    ? '#202224'
                    : '#f2f6fc',
                  fontWeight: msg.unread ? 700 : 400,
                  outline: isFocused ? `2px solid ${theme.palette.primary.main}` : 'none',
                  outlineOffset: '-2px',
                  transition: 'background-color 0.1s',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? isDark
                        ? '#004a77'
                        : '#c2e7ff'
                      : isDark
                      ? '#303236'
                      : '#f5f5f5',
                    boxShadow: isDark
                      ? 'inset 1px 0 0 #5f6368, inset -1px 0 0 #5f6368'
                      : 'inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0, 0 1px 2px 0 rgba(60,64,67,0.3)',
                  },
                }}
              >
                {/* Select Checkbox */}
                <Box
                  onClick={(e) => handleToggleSelect(msg.uid, e)}
                  sx={{ display: 'flex', alignItems: 'center', mr: 1 }}
                >
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    sx={{ p: 0.5, color: theme.palette.text.secondary }}
                  />
                </Box>

                {/* Star Icon */}
                <Box
                  onClick={(e) => handleToggleStar(msg.uid, msg.starred, e)}
                  sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}
                >
                  {msg.starred ? (
                    <StarIcon sx={{ fontSize: 20, color: '#f4b400' }} />
                  ) : (
                    <StarBorderIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                  )}
                </Box>

                {/* Sender / Recipient Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', width: 210, minWidth: 210, mr: 1 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontSize,
                      fontWeight: msg.unread ? 700 : 500,
                      color: msg.unread ? theme.palette.text.primary : theme.palette.text.secondary,
                    }}
                  >
                    {isSentFolder && msg.to && msg.to.length > 0
                      ? `To: ${msg.to[0]?.name || msg.to[0]?.address || 'Unknown'}`
                      : msg.from[0]?.name || msg.from[0]?.address || 'Unknown'}
                  </Typography>
                  {threadCount > 1 && (
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 1,
                        px: 0.6,
                        py: 0.1,
                        borderRadius: '4px',
                        bgcolor: isDark ? '#3c4043' : '#e8f0fe',
                        color: isDark ? '#a8c7fa' : '#0b57d0',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    >
                      {threadCount}
                    </Typography>
                  )}
                </Box>

                {/* Streak Email Tracking Indicator */}
                {(() => {
                  const trk = getTrackingForMessage(msg);
                  if (!trk && !isSentFolder) return null;
                  const isOpened = Boolean(trk && trk.openCount > 0);
                  const openCount = trk ? trk.openCount : 0;
                  const lastOpened = trk?.lastOpenedAt
                    ? new Date(trk.lastOpenedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : null;
                  const tooltipText = isOpened
                    ? `Read ${openCount} time${openCount > 1 ? 's' : ''}${lastOpened ? `. Last read: ${lastOpened}` : ''}`
                    : 'Not yet opened';

                  return (
                    <Tooltip title={tooltipText} arrow placement="top">
                      <Box
                        component="span"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.35,
                          mr: 1.2,
                          px: 0.6,
                          py: 0.2,
                          borderRadius: '4px',
                          backgroundColor: isOpened
                            ? isDark
                              ? 'rgba(22, 163, 74, 0.2)'
                              : 'rgba(22, 163, 74, 0.1)'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.04)',
                          border: isOpened
                            ? '1px solid rgba(22, 163, 74, 0.3)'
                            : '1px solid transparent',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <VisibilityIcon
                          sx={{
                            fontSize: 14,
                            color: isOpened ? '#16a34a' : isDark ? '#9aa0a6' : '#80868b',
                          }}
                        />
                        {isOpened && (
                          <Typography
                            component="span"
                            sx={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: '#16a34a',
                              lineHeight: 1,
                            }}
                          >
                            {openCount}
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })()}

                {/* Subject and Snippet */}
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    mr: 2,
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontSize,
                      fontWeight: msg.unread ? 700 : 500,
                      color: theme.palette.text.primary,
                      mr: 1,
                    }}
                  >
                    {msg.subject || '(no subject)'}
                  </Typography>
                  <Typography
                    noWrap
                    sx={{
                      fontSize,
                      fontWeight: 400,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    — {msg.snippet || ''}
                  </Typography>
                </Box>

                {/* Has Attachment indicator */}
                {msg.hasAttachment && (
                  <AttachFileIcon
                    sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1.5 }}
                  />
                )}

                {/* Right Area: Hover Actions OR Date */}
                <Box sx={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {isHovered ? (
                    <Box
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backgroundColor: 'inherit',
                      }}
                    >
                      <Tooltip title="Archive">
                        <IconButton
                          size="small"
                          onClick={() => onAction('archive', [msg.uid])}
                          sx={{ color: theme.palette.text.secondary, p: 0.5 }}
                        >
                          <ArchiveOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => onAction('delete', [msg.uid])}
                          sx={{ color: theme.palette.text.secondary, p: 0.5 }}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={msg.unread ? 'Mark as read' : 'Mark as unread'}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            onAction(msg.unread ? 'markRead' : 'markUnread', [msg.uid])
                          }
                          sx={{ color: theme.palette.text.secondary, p: 0.5 }}
                        >
                          {msg.unread ? (
                            <MarkEmailReadOutlinedIcon fontSize="small" />
                          ) : (
                            <MarkEmailUnreadOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Snooze">
                        <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
                          <AccessTimeOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: msg.unread ? 700 : 500,
                        color: msg.unread ? theme.palette.text.primary : theme.palette.text.secondary,
                      }}
                    >
                      {formatDate(msg.date)}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
