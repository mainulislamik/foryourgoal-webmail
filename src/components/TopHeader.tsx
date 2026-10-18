'use client';
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  InputBase,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AppsIcon from '@mui/icons-material/Apps';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';

interface TopHeaderProps {
  user: {
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

export default function TopHeader({
  user,
  onSearch,
  onOpenSettings,
  onLogout,
  onToggleSidebar,
}: TopHeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(searchValue);
    }
  };

  return (
    <Box
      sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        backgroundColor: '#f6f8fc',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Left: Brand & Hamburger */}
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 240, gap: 1 }}>
        <IconButton onClick={onToggleSidebar} sx={{ color: '#444746' }}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              backgroundColor: '#0b57d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <MarkEmailReadOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              fontSize: '1.25rem',
              color: '#1f1f1f',
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <span>ForYourGoal</span>
            <span style={{ color: '#5f6368', fontWeight: 400 }}>Mail</span>
          </Typography>
        </Box>
      </Box>

      {/* Center: Search Box */}
      <Box
        sx={{
          flex: 1,
          maxWidth: 720,
          mx: 2,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#eaf1fb',
          borderRadius: '24px',
          px: 2,
          py: 0.5,
          transition: 'all 0.2s',
          '&:focus-within': {
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
          },
        }}
      >
        <Tooltip title="Search">
          <IconButton
            size="small"
            onClick={() => onSearch(searchValue)}
            sx={{ color: '#444746', mr: 1 }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
        <InputBase
          placeholder="Search mail"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          sx={{
            fontSize: '1rem',
            color: '#1f1f1f',
            '& input::placeholder': {
              color: '#5f6368',
              opacity: 1,
            },
          }}
        />
        <Tooltip title="Search options">
          <IconButton size="small" sx={{ color: '#444746' }}>
            <TuneIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Right: Actions & User Avatar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Support">
          <IconButton sx={{ color: '#444746' }}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton onClick={onOpenSettings} sx={{ color: '#444746' }}>
            <SettingsOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Google apps">
          <IconButton sx={{ color: '#444746' }}>
            <AppsIcon />
          </IconButton>
        </Tooltip>

        {/* User Avatar */}
        <Tooltip title={`Account: ${user.displayName} (${user.email})`}>
          <IconButton onClick={handleProfileClick} sx={{ p: 0.5, ml: 1 }}>
            <Avatar
              src={user.avatarUrl}
              alt={user.displayName}
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#0b57d0',
                fontSize: '1rem',
                fontWeight: 600,
                border: '2px solid #ffffff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: 320,
              borderRadius: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              p: 2,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
            <Avatar
              src={user.avatarUrl}
              sx={{
                width: 72,
                height: 72,
                bgcolor: '#0b57d0',
                fontSize: '2rem',
                mb: 1.5,
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f1f1f' }}>
              {user.displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#5f6368', mb: 1 }}>
              {user.email}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '12px',
                bgcolor: '#e8f0fe',
                color: '#0b57d0',
                fontWeight: 500,
                mb: 2,
              }}
            >
              ForYourGoal Enterprise Account
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <MenuItem
            onClick={() => {
              handleClose();
              onOpenSettings();
            }}
            sx={{ borderRadius: '12px' }}
          >
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Manage Profile & Photo" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleClose();
              onLogout();
            }}
            sx={{ borderRadius: '12px', color: '#d93025' }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: '#d93025' }} />
            </ListItemIcon>
            <ListItemText primary="Sign out" />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
