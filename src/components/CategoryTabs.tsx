'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface CategoryTabsProps {
  currentCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryTabs({
  currentCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  const tabs = [
    {
      id: 'primary',
      label: 'Primary',
      icon: <InboxIcon sx={{ fontSize: 20 }} />,
      color: '#0b57d0',
    },
    {
      id: 'promotions',
      label: 'Promotions',
      icon: <LocalOfferOutlinedIcon sx={{ fontSize: 20 }} />,
      color: '#188038',
    },
    {
      id: 'social',
      label: 'Social',
      icon: <PeopleAltOutlinedIcon sx={{ fontSize: 20 }} />,
      color: '#1a73e8',
    },
    {
      id: 'updates',
      label: 'Updates',
      icon: <InfoOutlinedIcon sx={{ fontSize: 20 }} />,
      color: '#e37400',
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        borderBottom: '1px solid #e0e2ec',
        backgroundColor: '#ffffff',
        px: 2,
        userSelect: 'none',
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentCategory === tab.id;
        return (
          <Box
            key={tab.id}
            onClick={() => onSelectCategory(tab.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 3,
              py: 1.5,
              cursor: 'pointer',
              color: isActive ? tab.color : '#444746',
              fontWeight: isActive ? 600 : 500,
              borderBottom: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
              transition: 'all 0.15s ease-in-out',
              '&:hover': {
                backgroundColor: '#f1f3f4',
              },
            }}
          >
            <Box sx={{ color: isActive ? tab.color : '#5f6368', display: 'flex' }}>
              {tab.icon}
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
