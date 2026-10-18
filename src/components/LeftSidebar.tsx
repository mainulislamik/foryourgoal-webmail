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
} from '@mui/material';
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
      icon: <InboxIcon />,
      unread: getUnread('INBOX'),
    },
    {
      id: 'Starred',
      label: 'Starred',
      icon: <StarBorderIcon />,
      unread: 0,
    },
    {
      id: 'Sent',
      label: 'Sent',
      icon: <SendOutlinedIcon />,
      unread: 0,
    },
    {
      id: 'Drafts',
      label: 'Drafts',
      icon: <InsertDriveFileOutlinedIcon />,
      unread: getUnread('Drafts'),
    },
    {
      id: 'Trash',
      label: 'Trash',
      icon: <DeleteOutlineOutlinedIcon />,
      unread: 0,
    },
    {
      id: 'Junk',
      label: 'Spam',
      icon: <ReportGmailerrorredOutlinedIcon />,
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
        backgroundColor: '#f6f8fc',
        userSelect: 'none',
      }}
    >
      <Box>
        {/* Gmail Floating Pill Compose Button */}
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
            fontSize: '0.95rem',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
            textTransform: 'none',
            mb: 2,
            '&:hover': {
              backgroundColor: '#b3d7ef',
              boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
            },
          }}
        >
          {!collapsed && 'Compose'}
        </Button>

        {/* Navigation List */}
        <List sx={{ p: 0 }}>
          {navItems.map((item) => {
            const isSelected =
              currentFolder.toLowerCase() === item.id.toLowerCase();
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onSelectFolder(item.id)}
                  sx={{
                    borderRadius: '24px',
                    py: 1,
                    px: collapsed ? 1.5 : 2.5,
                    backgroundColor: isSelected ? '#d3e3fd' : 'transparent',
                    color: isSelected ? '#041e49' : '#444746',
                    fontWeight: isSelected ? 600 : 500,
                    '&:hover': {
                      backgroundColor: isSelected ? '#d3e3fd' : '#eaebef',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 40,
                      color: isSelected ? '#041e49' : '#444746',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: isSelected ? 700 : 500,
                      }}
                    />
                  )}
                  {!collapsed && item.unread > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: isSelected ? '#041e49' : '#1f1f1f',
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
        <Box sx={{ px: 2, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CloudQueueIcon sx={{ fontSize: 18, color: '#5f6368' }} />
            <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500 }}>
              0.12 GB of 15 GB used
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={3}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: '#e0e2ec',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#0b57d0',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
