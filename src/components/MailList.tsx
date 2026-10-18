'use client';
import React, { useState } from 'react';
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
import { EmailHeader } from '@/lib/imap';
import { useThemeMode } from '@/contexts/ThemeContext';

interface MailListProps {
  messages: EmailHeader[];
  loading: boolean;
  onSelectMessage: (msg: EmailHeader) => void;
  onRefresh: () => void;
  onAction: (action: string, uids: number[]) => void;
  focusedIndex?: number;
}

export default function MailList({
  messages,
  loading,
  onSelectMessage,
  onRefresh,
  onAction,
  focusedIndex = -1,
}: MailListProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { density } = useThemeMode();

  const [selectedUids, setSelectedUids] = useState<number[]>([]);
  const [hoveredUid, setHoveredUid] = useState<number | null>(null);

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
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {messages.length > 0 ? `1–${messages.length} of ${messages.length}` : '0 of 0'}
          </Typography>
        </Box>
      </Box>

      {/* Message List */}
      <Box sx={{ flex: 1, overflowY: 'auto', backgroundColor: theme.palette.background.paper }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Your inbox is empty
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

                {/* Sender Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', width: 210, minWidth: 210, mr: 1 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontSize,
                      fontWeight: msg.unread ? 700 : 500,
                      color: msg.unread ? theme.palette.text.primary : theme.palette.text.secondary,
                    }}
                  >
                    {msg.from[0]?.name || msg.from[0]?.address || 'Unknown'}
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
