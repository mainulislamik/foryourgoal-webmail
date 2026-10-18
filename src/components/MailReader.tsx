'use client';
import React, { useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import ForwardOutlinedIcon from '@mui/icons-material/ForwardOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { EmailHeader } from '@/lib/imap';

interface EmailDetail extends EmailHeader {
  html: string;
  text: string;
  attachments?: {
    filename: string;
    contentType: string;
    size: number;
    partId: string;
  }[];
}

interface MailReaderProps {
  message: EmailHeader;
  detail: EmailDetail | null;
  loading: boolean;
  onBack: () => void;
  onAction: (action: string, uids: number[]) => void;
  onReply: (quote?: string) => void;
  onForward: () => void;
}

export default function MailReader({
  message,
  detail,
  loading,
  onBack,
  onAction,
  onReply,
  onForward,
}: MailReaderProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const sender = message.from[0]?.name || message.from[0]?.address || 'Unknown';
  const senderEmail = message.from[0]?.address || '';

  // Smart Reply suggestions
  const smartReplies = [
    'Received with thanks, looking forward to it!',
    'I will review this and update you shortly.',
    'Thank you for confirming. Noted!',
  ];

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
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Print">
            <IconButton size="small" onClick={() => window.print()} sx={{ color: theme.palette.text.secondary }}>
              <PrintOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Message Content Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: { xs: 2, sm: 4 },
          backgroundColor: theme.palette.background.paper,
        }}
      >
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
                dangerouslySetInnerHTML={{ __html: detail.html }}
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
                        <IconButton size="small">
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
    </Box>
  );
}
