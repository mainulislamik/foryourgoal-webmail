'use client';
import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { EmailHeader } from '@/lib/imap';

interface MailListProps {
  messages: EmailHeader[];
  loading: boolean;
  onSelectMessage: (msg: EmailHeader) => void;
  onRefresh: () => void;
  onAction: (action: string, uids: number[]) => void;
}

export default function MailList({
  messages,
  loading,
  onSelectMessage,
  onRefresh,
  onAction,
}: MailListProps) {
  const [selectedUids, setSelectedUids] = useState<number[]>([]);
  const [hoveredUid, setHoveredUid] = useState<number | null>(null);

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
          borderBottom: '1px solid #e0e2ec',
          backgroundColor: '#ffffff',
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
            sx={{ color: '#444746', p: 0.5 }}
          />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh} sx={{ color: '#444746' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {selectedUids.length > 0 && (
            <>
              <Tooltip title="Archive">
                <IconButton
                  size="small"
                  onClick={() => onAction('archive', selectedUids)}
                  sx={{ color: '#444746' }}
                >
                  <ArchiveOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => onAction('delete', selectedUids)}
                  sx={{ color: '#444746' }}
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mark as read">
                <IconButton
                  size="small"
                  onClick={() => onAction('markRead', selectedUids)}
                  sx={{ color: '#444746' }}
                >
                  <MarkEmailReadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500 }}>
            {messages.length > 0 ? `1–${messages.length} of ${messages.length}` : '0 of 0'}
          </Typography>
        </Box>
      </Box>

      {/* Message List */}
      <Box sx={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} sx={{ color: '#0b57d0' }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="body1" sx={{ color: '#5f6368' }}>
              Your inbox is empty
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => {
            const isSelected = selectedUids.includes(msg.uid);
            const isHovered = hoveredUid === msg.uid;

            return (
              <Box
                key={msg.uid}
                onClick={() => onSelectMessage(msg)}
                onMouseEnter={() => setHoveredUid(msg.uid)}
                onMouseLeave={() => setHoveredUid(null)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 40,
                  px: 2,
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  backgroundColor: msg.unread
                    ? '#ffffff'
                    : isSelected
                    ? '#c2e7ff'
                    : '#f2f6fc',
                  fontWeight: msg.unread ? 700 : 400,
                  transition: 'background-color 0.1s',
                  '&:hover': {
                    backgroundColor: isSelected ? '#c2e7ff' : '#f5f5f5',
                    boxShadow: 'inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0, 0 1px 2px 0 rgba(60,64,67,0.3)',
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
                    sx={{ p: 0.5, color: '#444746' }}
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
                    <StarBorderIcon sx={{ fontSize: 20, color: '#5f6368' }} />
                  )}
                </Box>

                {/* Sender Name */}
                <Typography
                  noWrap
                  sx={{
                    width: 200,
                    minWidth: 200,
                    fontSize: '0.875rem',
                    fontWeight: msg.unread ? 700 : 500,
                    color: msg.unread ? '#1f1f1f' : '#444746',
                  }}
                >
                  {msg.from[0]?.name || msg.from[0]?.address || 'Unknown'}
                </Typography>

                {/* Subject & Snippet */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0, mr: 2 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: msg.unread ? 700 : 400,
                      color: msg.unread ? '#1f1f1f' : '#444746',
                      mr: 1,
                    }}
                  >
                    {msg.subject || '(no subject)'}
                  </Typography>
                  <Typography
                    noWrap
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      color: '#5f6368',
                    }}
                  >
                    — {msg.snippet || ''}
                  </Typography>
                </Box>

                {/* Right Area: Hover Actions OR Date */}
                {isHovered ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backgroundColor: 'inherit',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Archive">
                      <IconButton
                        size="small"
                        onClick={() => onAction('archive', [msg.uid])}
                        sx={{ color: '#444746' }}
                      >
                        <ArchiveOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => onAction('delete', [msg.uid])}
                        sx={{ color: '#444746' }}
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
                        sx={{ color: '#444746' }}
                      >
                        {msg.unread ? (
                          <MarkEmailReadOutlinedIcon fontSize="small" />
                        ) : (
                          <MarkEmailUnreadOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Snooze">
                      <IconButton size="small" sx={{ color: '#444746' }}>
                        <AccessTimeOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      width: 80,
                      textAlign: 'right',
                      fontSize: '0.75rem',
                      fontWeight: msg.unread ? 700 : 500,
                      color: msg.unread ? '#1f1f1f' : '#5f6368',
                    }}
                  >
                    {formatDate(msg.date)}
                  </Typography>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
