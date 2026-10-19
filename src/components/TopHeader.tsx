'use client';
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  InputBase,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Typography,
  ListItemIcon,
  ListItemText,
  Popover,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AppsIcon from '@mui/icons-material/Apps';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckIcon from '@mui/icons-material/Check';
import { useThemeMode, DensityMode } from '@/contexts/ThemeContext';

interface TopHeaderProps {
  user: {
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export default function TopHeader({
  user,
  onSearch,
  onOpenSettings,
  onLogout,
  onToggleSidebar,
}: TopHeaderProps) {
  const theme = useTheme();
  const { mode, toggleTheme, density, setDensity } = useThemeMode();
  const isDark = mode === 'dark';

  const [searchValue, setSearchValue] = useState('');
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [densityAnchor, setDensityAnchor] = useState<null | HTMLElement>(null);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Advanced Search Filter State
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterWords, setFilterWords] = useState('');
  const [filterHasAttachment, setFilterHasAttachment] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchValue);
    }
  };

  const handleApplyFilter = () => {
    const parts: string[] = [];
    if (filterFrom.trim()) parts.push(`from:${filterFrom.trim()}`);
    if (filterTo.trim()) parts.push(`to:${filterTo.trim()}`);
    if (filterSubject.trim()) parts.push(`subject:${filterSubject.trim()}`);
    if (filterWords.trim()) parts.push(filterWords.trim());
    if (filterHasAttachment) parts.push('has:attachment');

    const constructed = parts.join(' ');
    setSearchValue(constructed);
    onSearch(constructed);
    setFilterAnchor(null);
  };

  const handleResetFilter = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterSubject('');
    setFilterWords('');
    setFilterHasAttachment(false);
    setSearchValue('');
    onSearch('');
    setFilterAnchor(null);
  };

  return (
    <Box
      sx={{
        height: 64,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.palette.background.default,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 1100,
      }}
    >
      {/* Left: Hamburger & Brand */}
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 240 }}>
        <Tooltip title="Main menu">
          <IconButton
            onClick={onToggleSidebar}
            sx={{ mr: 1, color: theme.palette.text.secondary }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>

        <Box
          component="a"
          href="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          {/* Official ForYourGoal Logo */}
          <Box
            component="img"
            src={theme.palette.mode === 'dark' ? '/brand/for-your-goal-header-dark-background.svg' : '/brand/for-your-goal-header-light-background.svg'}
            alt="ForYourGoal"
            sx={{
              height: 30,
              width: 'auto',
              display: { xs: 'none', sm: 'block' },
            }}
          />
          {/* Mobile Mark Only */}
          <Box
            component="img"
            src={theme.palette.mode === 'dark' ? '/brand/fg-mark-dark-background.svg' : '/brand/fg-mark-light-background.svg'}
            alt="ForYourGoal"
            sx={{
              height: 28,
              width: 'auto',
              display: { xs: 'block', sm: 'none' },
            }}
          />
          <Box
            component="span"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 700,
              px: 0.8,
              py: 0.2,
              borderRadius: 1,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(36,123,255,0.2)' : 'rgba(36,123,255,0.1)',
              color: '#247BFF',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Mail
          </Box>
        </Box>
      </Box>

      {/* Center: Search Box & Filter Trigger */}
      <Box
        id="search-container"
        sx={{
          flex: 1,
          maxWidth: 720,
          mx: 2,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isDark ? '#2b2d30' : '#eaf1fb',
          borderRadius: '24px',
          px: 2,
          py: 0.5,
          transition: 'all 0.2s',
          border: `1px solid ${isDark ? '#3c4043' : 'transparent'}`,
          '&:focus-within': {
            backgroundColor: isDark ? '#303236' : '#ffffff',
            boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
            borderColor: 'transparent',
          },
        }}
      >
        <Tooltip title="Search">
          <IconButton
            size="small"
            onClick={() => onSearch(searchValue)}
            sx={{ color: theme.palette.text.secondary, mr: 1 }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
        <InputBase
          id="mail-search-input"
          placeholder="Search mail (press / to focus)"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          sx={{
            fontSize: '1rem',
            color: theme.palette.text.primary,
            '& input::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 0.8,
            },
          }}
        />
        <Tooltip title="Show search options">
          <IconButton
            size="small"
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{
              color: filterAnchor ? theme.palette.primary.main : theme.palette.text.secondary,
            }}
          >
            <TuneIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Advanced Search Options Popover */}
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 480,
            maxWidth: '90vw',
            p: 3,
            borderRadius: '16px',
            mt: 1,
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
          },
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}>
          Advanced Search Options
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="From"
            size="small"
            fullWidth
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            placeholder="e.g. imon@foryourgoal.com"
          />
          <TextField
            label="To"
            size="small"
            fullWidth
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            placeholder="e.g. client@example.com"
          />
          <TextField
            label="Subject"
            size="small"
            fullWidth
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            placeholder="e.g. Invoice, Project Update"
          />
          <TextField
            label="Has the words"
            size="small"
            fullWidth
            value={filterWords}
            onChange={(e) => setFilterWords(e.target.value)}
            placeholder="Keywords in body or subject"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filterHasAttachment}
                onChange={(e) => setFilterHasAttachment(e.target.checked)}
                color="primary"
              />
            }
            label="Has attachment"
            sx={{ color: theme.palette.text.primary }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
            <Button variant="text" onClick={handleResetFilter} sx={{ color: theme.palette.text.secondary }}>
              Reset
            </Button>
            <Button variant="contained" onClick={handleApplyFilter} sx={{ bgcolor: theme.palette.primary.main }}>
              Search
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Right Action Icons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Dark Mode Toggle */}
        <Tooltip title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}>
          <IconButton onClick={toggleTheme} sx={{ color: theme.palette.text.secondary }}>
            {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Tooltip>

        {/* Display Density Selector */}
        <Tooltip title="Display density">
          <IconButton
            onClick={(e) => setDensityAnchor(e.currentTarget)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <ViewHeadlineIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={densityAnchor}
          open={Boolean(densityAnchor)}
          onClose={() => setDensityAnchor(null)}
          PaperProps={{ sx: { borderRadius: '16px', minWidth: 180 } }}
        >
          <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: theme.palette.text.secondary }}>
            Display Density
          </Typography>
          {(['default', 'comfortable', 'compact'] as DensityMode[]).map((d) => (
            <MenuItem
              key={d}
              onClick={() => {
                setDensity(d);
                setDensityAnchor(null);
              }}
              selected={density === d}
              sx={{ borderRadius: '8px', mx: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {density === d ? <CheckIcon fontSize="small" sx={{ color: theme.palette.primary.main }} /> : null}
              </ListItemIcon>
              <ListItemText
                primary={d.charAt(0).toUpperCase() + d.slice(1)}
                primaryTypographyProps={{ sx: { fontWeight: density === d ? 600 : 400 } }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Keyboard Shortcuts Dialog Trigger */}
        <Tooltip title="Keyboard shortcuts (?)">
          <IconButton onClick={() => setShortcutsOpen(true)} sx={{ color: theme.palette.text.secondary }}>
            <KeyboardIcon />
          </IconButton>
        </Tooltip>

        {/* Settings */}
        <Tooltip title="Settings">
          <IconButton onClick={onOpenSettings} sx={{ color: theme.palette.text.secondary }}>
            <SettingsOutlinedIcon />
          </IconButton>
        </Tooltip>

        {/* Google Apps */}
        <Tooltip title="Google apps">
          <IconButton sx={{ color: theme.palette.text.secondary }}>
            <AppsIcon />
          </IconButton>
        </Tooltip>

        {/* User Profile Avatar */}
        <Tooltip title={`Account: ${user.displayName} (${user.email})`}>
          <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ p: 0.5, ml: 0.5 }}>
            <Avatar
              src={user.avatarUrl}
              alt={user.displayName}
              sx={{
                width: 36,
                height: 36,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontSize: '1rem',
                fontWeight: 600,
                border: `2px solid ${isDark ? '#3c4043' : '#ffffff'}`,
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: 320,
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              p: 2,
              backgroundColor: theme.palette.background.paper,
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
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontSize: '2rem',
                mb: 1.5,
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {user.displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
              {user.email}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '12px',
                bgcolor: isDark ? '#004a77' : '#e8f0fe',
                color: isDark ? '#a8c7fa' : '#0b57d0',
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
              setProfileAnchor(null);
              onOpenSettings();
            }}
            sx={{ borderRadius: '12px' }}
          >
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
            </ListItemIcon>
            <ListItemText primary="Manage Profile & Photo" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              setProfileAnchor(null);
              onLogout();
            }}
            sx={{ borderRadius: '12px', color: '#ea4335' }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: '#ea4335' }} />
            </ListItemIcon>
            <ListItemText primary="Sign out" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Keyboard Shortcuts Popover/Modal */}
      <Popover
        open={shortcutsOpen}
        anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
        transformOrigin={{ vertical: 'center', horizontal: 'center' }}
        onClose={() => setShortcutsOpen(false)}
        PaperProps={{
          sx: {
            p: 3,
            borderRadius: '20px',
            maxWidth: 440,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}>
          Gmail Keyboard Shortcuts
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[
            { key: 'c', desc: 'Compose new message' },
            { key: '/', desc: 'Focus search bar' },
            { key: 'j / k', desc: 'Next / Previous message in list' },
            { key: 'e', desc: 'Archive selected message' },
            { key: '#', desc: 'Delete message' },
            { key: 'r', desc: 'Reply to message' },
            { key: 'Esc', desc: 'Close compose, modal or reader' },
          ].map((item) => (
            <Box
              key={item.key}
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                {item.desc}
              </Typography>
              <Box
                sx={{
                  px: 1.2,
                  py: 0.3,
                  borderRadius: '6px',
                  bgcolor: isDark ? '#3c4043' : '#f1f3f4',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                {item.key}
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={() => setShortcutsOpen(false)} variant="contained" size="small">
            Got it
          </Button>
        </Box>
      </Popover>
    </Box>
  );
}
