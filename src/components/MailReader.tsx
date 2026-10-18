'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Avatar,
  Tooltip,
  Button,
  CircularProgress,
  Chip,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import ForwardOutlinedIcon from '@mui/icons-material/ForwardOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { EmailHeader, EmailDetail } from '@/lib/imap';

interface MailReaderProps {
  messageHeader: EmailHeader;
  currentFolder: string;
  onBack: () => void;
  onReply: (to: string, subject: string, quoteBody?: string) => void;
  onForward: (subject: string, quoteBody?: string) => void;
  onAction: (action: string, uids: number[]) => void;
}

export default function MailReader({
  messageHeader,
  currentFolder,
  onBack,
  onReply,
  onForward,
  onAction,
}: MailReaderProps) {
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starred, setStarred] = useState(messageHeader.starred);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/mail/message/${messageHeader.uid}?folder=${encodeURIComponent(currentFolder)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.message) {
            setDetail(data.message);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load email detail:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [messageHeader.uid, currentFolder]);

  const handleToggleStar = () => {
    const nextState = !starred;
    setStarred(nextState);
    onAction(nextState ? 'star' : 'unstar', [messageHeader.uid]);
  };

  const sender = detail?.from[0] || messageHeader.from[0];
  const senderName = sender?.name || sender?.address || 'Unknown';
  const senderAddress = sender?.address || '';
  const initial = senderName.charAt(0).toUpperCase();

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: '#ffffff' }}>
      {/* Top Toolbar with Back Arrow */}
      <Box
        sx={{
          height: 48,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e0e2ec',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Back to Inbox">
            <IconButton
              onClick={onBack}
              sx={{
                color: '#444746',
                backgroundColor: 'rgba(0,0,0,0.04)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Archive">
            <IconButton
              size="small"
              onClick={() => {
                onAction('archive', [messageHeader.uid]);
                onBack();
              }}
              sx={{ color: '#444746' }}
            >
              <ArchiveOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Report spam">
            <IconButton size="small" sx={{ color: '#444746' }}>
              <ReportGmailerrorredOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                onAction('delete', [messageHeader.uid]);
                onBack();
              }}
              sx={{ color: '#444746' }}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mark as unread">
            <IconButton
              size="small"
              onClick={() => {
                onAction('markUnread', [messageHeader.uid]);
                onBack();
              }}
              sx={{ color: '#444746' }}
            >
              <MarkEmailUnreadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move to">
            <IconButton size="small" sx={{ color: '#444746' }}>
              <DriveFileMoveOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Labels">
            <IconButton size="small" sx={{ color: '#444746' }}>
              <LabelOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Print all">
            <IconButton size="small" onClick={() => window.print()} sx={{ color: '#444746' }}>
              <PrintOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="In new window">
            <IconButton size="small" sx={{ color: '#444746' }}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Reader Content Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, maxWidth: 1100, mx: 'auto', width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={40} sx={{ color: '#0b57d0' }} />
          </Box>
        ) : (
          <>
            {/* Subject Header */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontSize: '1.4rem',
                color: '#1f1f1f',
                mb: 3,
                wordBreak: 'break-word',
              }}
            >
              {detail?.subject || messageHeader.subject}
            </Typography>

            {/* Sender Row Card */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: '#0b57d0',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                  }}
                >
                  {initial}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1f1f1f' }}>
                      {senderName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#5f6368', fontSize: '0.85rem' }}>
                      &lt;{senderAddress}&gt;
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#5f6368' }}>
                    to me
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#5f6368', mr: 1 }}>
                  {formatFullDate(detail?.date || messageHeader.date)}
                </Typography>
                <Tooltip title={starred ? 'Starred' : 'Not starred'}>
                  <IconButton size="small" onClick={handleToggleStar}>
                    {starred ? (
                      <StarIcon sx={{ fontSize: 20, color: '#f4b400' }} />
                    ) : (
                      <StarBorderIcon sx={{ fontSize: 20, color: '#5f6368' }} />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reply">
                  <IconButton
                    size="small"
                    onClick={() =>
                      onReply(
                        senderAddress,
                        `Re: ${detail?.subject || messageHeader.subject}`,
                        detail?.text || detail?.html
                      )
                    }
                  >
                    <ReplyOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Email Body Content */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '8px',
                border: '1px solid #f0f0f0',
                backgroundColor: '#ffffff',
                minHeight: 200,
                color: '#1f1f1f',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                wordBreak: 'break-word',
                mb: 4,
                '& a': {
                  color: '#0b57d0',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                },
              }}
            >
              {detail?.html ? (
                <div dangerouslySetInnerHTML={{ __html: detail.html }} />
              ) : (
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: 'inherit',
                    whiteSpace: 'pre-wrap',
                    color: '#1f1f1f',
                  }}
                >
                  {detail?.text || messageHeader.snippet || '(No content)'}
                </Typography>
              )}
            </Paper>

            {/* Attachments Section */}
            {detail?.attachments && detail.attachments.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#444746', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFileIcon fontSize="small" />
                  {detail.attachments.length} Attachment{detail.attachments.length > 1 ? 's' : ''}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {detail.attachments.map((att, idx) => (
                    <Chip
                      key={idx}
                      icon={<DownloadIcon />}
                      label={`${att.filename || 'attachment'} (${Math.round(att.size / 1024)} KB)`}
                      variant="outlined"
                      clickable
                      sx={{ borderRadius: '8px', py: 2 }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Bottom Gmail Reply and Forward Action Pills */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 4 }}>
              <Button
                variant="outlined"
                startIcon={<ReplyOutlinedIcon />}
                onClick={() =>
                  onReply(
                    senderAddress,
                    `Re: ${detail?.subject || messageHeader.subject}`,
                    detail?.text || detail?.html
                  )
                }
                sx={{
                  borderRadius: '24px',
                  borderColor: '#747775',
                  color: '#444746',
                  px: 3,
                  py: 1,
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#1f1f1f',
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Reply
              </Button>
              <Button
                variant="outlined"
                startIcon={<ForwardOutlinedIcon />}
                onClick={() =>
                  onForward(
                    `Fwd: ${detail?.subject || messageHeader.subject}`,
                    detail?.text || detail?.html
                  )
                }
                sx={{
                  borderRadius: '24px',
                  borderColor: '#747775',
                  color: '#444746',
                  px: 3,
                  py: 1,
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#1f1f1f',
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Forward
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
