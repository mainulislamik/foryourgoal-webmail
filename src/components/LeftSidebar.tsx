'use client';
import React from 'react';
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
import { FolderInfo } from '@/lib/imap';

interface LeftSidebarProps {
  currentFolder: string;
  folders: FolderInfo[];
  onSelectFolder: (folder: string) => void;
  onOpenCompose: () => void;
  collapsed?: boolean;
}

export default function LeftSidebar({
  currentFolder,
  folders,
  onSelectFolder,
  onOpenCompose,
  collapsed = false,
}: LeftSidebarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
      </Box>

      {/* Storage Indicator */}
      {!collapsed && (
        <Box sx={{ px: 1, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
            <CloudQueueIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              0.08 GB of 15 GB used
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={1}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? '#3c4043' : '#e0e2ec',
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
