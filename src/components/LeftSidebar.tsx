'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InboxIcon from '@mui/icons-material/Inbox';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import AddIcon from '@mui/icons-material/Add';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  IconButton,
} from '@mui/material';
import { FolderInfo } from '@/lib/imap';

interface LeftSidebarProps {
  currentFolder: string;
  folders: FolderInfo[];
  onSelectFolder: (folder: string) => void;
  onOpenCompose: () => void;
  onRefreshFolders?: () => void;
  collapsed?: boolean;
}

export default function LeftSidebar({
  currentFolder,
  folders,
  onSelectFolder,
  onOpenCompose,
  onRefreshFolders,
  collapsed = false,
}: LeftSidebarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [quota, setQuota] = useState<{
    usedFormatted: string;
    totalFormatted: string;
    percentage: number;
    details?: string;
  }>({
    usedFormatted: '0.08 GB',
    totalFormatted: 'VPS Storage',
    percentage: 1,
  });

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch('/api/mail/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (res.ok) {
        setNewFolderName('');
        setCreateDialogOpen(false);
        if (onRefreshFolders) onRefreshFolders();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create folder');
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    } finally {
      setCreatingFolder(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetch('/api/mail/quota')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data && data.usedFormatted) {
          setQuota({
            usedFormatted: data.usedFormatted,
            totalFormatted: data.totalFormatted,
            percentage: data.percentage ?? 1,
            details: data.details,
          });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const getUnread = (pathName: string) => {
    const f = folders.find(
      (item) => item.path.toLowerCase() === pathName.toLowerCase()
    );
    return f ? f.unreadCount : 0;
  };

  const navItems = [
    {
      id: 'INBOX',
      label: 'Inbox',
      icon: <InboxIcon fontSize="small" />,
      unread: getUnread('INBOX'),
    },
    {
      id: 'Starred',
      label: 'Starred',
      icon: <StarBorderIcon fontSize="small" />,
      unread: 0,
    },
    {
      id: 'Sent',
      label: 'Sent',
      icon: <SendOutlinedIcon fontSize="small" />,
      unread: 0,
    },
    {
      id: 'Drafts',
      label: 'Drafts',
      icon: <InsertDriveFileOutlinedIcon fontSize="small" />,
      unread: getUnread('Drafts'),
    },
    {
      id: 'Trash',
      label: 'Trash',
      icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
      unread: 0,
    },
    {
      id: 'Junk',
      label: 'Spam',
      icon: <ReportGmailerrorredOutlinedIcon fontSize="small" />,
      unread: getUnread('Junk'),
    },
  ];

  return (
    <Box
      sx={{
        width: collapsed ? 72 : 256,
        transition: 'width 0.2s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        py: 2,
        px: collapsed ? 1 : 2,
        backgroundColor: theme.palette.background.default,
        userSelect: 'none',
      }}
    >
      <Box>
        {/* Gmail Floating Pill Compose Button */}
        <Tooltip title={collapsed ? 'Compose' : ''} placement="right">
          <Button
            variant="contained"
            onClick={onOpenCompose}
            startIcon={
              <EditOutlinedIcon
                sx={{
                  fontSize: 24,
                  color: '#001d35',
                }}
              />
            }
            sx={{
              backgroundColor: '#c2e7ff',
              color: '#001d35',
              borderRadius: '16px',
              px: collapsed ? 0 : 3,
              py: 2,
              minWidth: collapsed ? 48 : 140,
              height: 56,
              fontWeight: 500,
              fontSize: '0.875rem',
              letterSpacing: '0.1px',
              boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
              mb: 2,
              ml: collapsed ? 0.5 : 0,
              display: 'flex',
              justifyContent: collapsed ? 'center' : 'flex-start',
              '&:hover': {
                backgroundColor: '#b3d7ff',
                boxShadow: '0 2px 6px 2px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.3)',
              },
            }}
          >
            {!collapsed && 'Compose'}
          </Button>
        </Tooltip>

        {/* Navigation List */}
        <List sx={{ p: 0 }}>
          {navItems.map((item) => {
            const isActive =
              currentFolder.toLowerCase() === item.id.toLowerCase();

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onSelectFolder(item.id)}
                  sx={{
                    borderRadius: '24px',
                    height: 36,
                    px: collapsed ? 1.5 : 2.5,
                    backgroundColor: isActive
                      ? isDark
                        ? '#004a77'
                        : '#c2e7ff'
                      : 'transparent',
                    color: isActive
                      ? isDark
                        ? '#a8c7fa'
                        : '#001d35'
                      : theme.palette.text.secondary,
                    fontWeight: isActive || item.unread > 0 ? 700 : 400,
                    '&:hover': {
                      backgroundColor: isActive
                        ? isDark
                          ? '#004a77'
                          : '#c2e7ff'
                        : isDark
                        ? '#2b2d30'
                        : '#eaebef',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 36,
                      color: isActive
                        ? isDark
                          ? '#a8c7fa'
                          : '#001d35'
                        : theme.palette.text.secondary,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActive || item.unread > 0 ? 700 : 500,
                      }}
                    />
                  )}

                  {!collapsed && item.unread > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: isActive
                          ? isDark
                            ? '#a8c7fa'
                            : '#001d35'
                          : theme.palette.text.primary,
                      }}
                    >
                      {item.unread}
                    </Typography>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Custom Folders / Labels Section */}
        {!collapsed && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                mb: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: theme.palette.text.secondary,
                }}
              >
                Folders
              </Typography>
              <Tooltip title="Create new folder">
                <IconButton
                  size="small"
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{ p: 0.5, color: theme.palette.text.secondary }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <List sx={{ p: 0 }}>
              {folders
                .filter(
                  (f) =>
                    !['inbox', 'starred', 'sent', 'drafts', 'trash', 'junk'].includes(
                      f.name.toLowerCase()
                    )
                )
                .map((f) => {
                  const isActive = currentFolder.toLowerCase() === f.path.toLowerCase();
                  return (
                    <ListItem key={f.path} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => onSelectFolder(f.path)}
                        sx={{
                          borderRadius: '24px',
                          height: 36,
                          px: 2.5,
                          backgroundColor: isActive
                            ? isDark
                              ? '#004a77'
                              : '#c2e7ff'
                            : 'transparent',
                          color: isActive
                            ? isDark
                              ? '#a8c7fa'
                              : '#001d35'
                            : theme.palette.text.secondary,
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: isActive
                              ? isDark
                                ? '#a8c7fa'
                                : '#001d35'
                              : theme.palette.text.secondary,
                          }}
                        >
                          <FolderOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={f.name}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 700 : 500,
                            noWrap: true,
                          }}
                        />
                        {f.unreadCount > 0 && (
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                          >
                            {f.unreadCount}
                          </Typography>
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
            </List>
          </Box>
        )}
      </Box>

      {/* Dynamic Storage Indicator */}
      {!collapsed && (
        <Tooltip
          title={
            quota.details
              ? quota.details
              : `${quota.usedFormatted} used of ${quota.totalFormatted} allocated storage on Linux VPS.`
          }
          arrow
          placement="top"
        >
          <Box sx={{ px: 1, py: 1.5, cursor: 'pointer' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
              <CloudQueueIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                {quota.usedFormatted} of {quota.totalFormatted} used
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.max(1, Math.min(100, quota.percentage))}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? '#3c4043' : '#e0e2ec',
                '& .MuiLinearProgress-bar': {
                  backgroundColor:
                    quota.percentage > 90
                      ? theme.palette.error.main
                      : quota.percentage > 75
                      ? theme.palette.warning.main
                      : theme.palette.primary.main,
                },
              }}
            />
          </Box>
        </Tooltip>
      )}

      {/* Create Folder Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Folder</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Folder Name"
            fullWidth
            size="small"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="e.g. Invoices, Clients"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ borderRadius: '20px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim() || creatingFolder}
            sx={{ borderRadius: '20px', textTransform: 'none' }}
          >
            {creatingFolder ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
