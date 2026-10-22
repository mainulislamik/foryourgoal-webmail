'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export interface Recipient {
  id: string;
  email: string;
  name?: string;
  isValid: boolean | null; // null = pending verification, true = valid, false = invalid
  reason?: string;
}

interface RecipientChipInputProps {
  id?: string;
  label: string;
  value: string; // Comma-separated emails string for compatibility
  onChange: (value: string) => void;
  placeholder?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = 'foryourgoal_contacts';

// Color generator for contact avatars
function stringToColor(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

// Memory cache for email MX verification to prevent duplicate network calls
const verificationCache = new Map<string, { valid: boolean; reason?: string }>();

export default function RecipientChipInput({
  id = 'recipient-chip-input',
  label,
  value,
  onChange,
  placeholder = 'Recipients',
  onBlur,
  onFocus,
  autoFocus = false,
}: RecipientChipInputProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [contacts, setContacts] = useState<Array<{ name: string; email: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load contacts from localStorage and server directory API
  useEffect(() => {
    let isMounted = true;
    async function loadContacts() {
      const contactMap = new Map<string, { name: string; email: string }>();

      // 1. LocalStorage
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((c: any) => {
                if (c.email) {
                  contactMap.set(c.email.toLowerCase(), { name: c.name || '', email: c.email });
                }
              });
            }
          }
        } catch (e) {
          // Ignore
        }
      }

      // 2. Fetch server directory accounts
      try {
        const res = await fetch('/api/mail/contacts');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.contacts)) {
            data.contacts.forEach((c: any) => {
              if (c.email) {
                contactMap.set(c.email.toLowerCase(), { name: c.name || '', email: c.email });
              }
            });
          }
        }
      } catch (e) {
        // Ignore network errors
      }

      if (isMounted) {
        setContacts(Array.from(contactMap.values()));
      }
    }

    loadContacts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Async email verification against /api/mail/verify-recipient
  const verifyEmail = useCallback(async (email: string, recipientId: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setRecipients((prev) =>
        prev.map((r) =>
          r.id === recipientId ? { ...r, isValid: false, reason: 'Invalid email format' } : r
        )
      );
      return;
    }

    if (verificationCache.has(trimmed)) {
      const cached = verificationCache.get(trimmed)!;
      setRecipients((prev) =>
        prev.map((r) =>
          r.id === recipientId ? { ...r, isValid: cached.valid, reason: cached.reason } : r
        )
      );
      return;
    }

    try {
      const res = await fetch('/api/mail/verify-recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      const valid = Boolean(data.valid);
      const reason = data.reason || (valid ? undefined : 'Domain does not accept emails');

      verificationCache.set(trimmed, { valid, reason });

      setRecipients((prev) =>
        prev.map((r) => (r.id === recipientId ? { ...r, isValid: valid, reason } : r))
      );
    } catch {
      // Fallback: If verification network fails, fallback to regex validity
      const regexValid = EMAIL_REGEX.test(trimmed);
      setRecipients((prev) =>
        prev.map((r) =>
          r.id === recipientId
            ? { ...r, isValid: regexValid, reason: regexValid ? undefined : 'Invalid address' }
            : r
        )
      );
    }
  }, []);

  // Synchronize internal recipients with incoming `value` prop
  const parseEmailsToRecipients = useCallback(
    (emailString: string): Recipient[] => {
      if (!emailString || !emailString.trim()) return [];

      const parts = emailString
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      return parts.map((part) => {
        // Match "Name <email@domain.com>" or "email@domain.com"
        const match = part.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)$/);
        const name = match && match[1] ? match[1].trim() : undefined;
        const email = match && match[2] ? match[2].trim() : part;
        const recipientId = Math.random().toString(36).substring(2, 9);
        const basicValid = EMAIL_REGEX.test(email);

        // Schedule async verification
        verifyEmail(email, recipientId);

        return {
          id: recipientId,
          email,
          name,
          isValid: basicValid ? null : false,
          reason: basicValid ? undefined : 'Invalid format',
        };
      });
    },
    [verifyEmail]
  );

  // Initial and external sync
  const lastPropValueRef = useRef(value);
  useEffect(() => {
    if (value !== lastPropValueRef.current) {
      lastPropValueRef.current = value;
      const currentEmails = recipients.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', ');
      if (value !== currentEmails) {
        setRecipients(parseEmailsToRecipients(value));
      }
    }
  }, [value, parseEmailsToRecipients, recipients]);

  // Notify parent of recipient list changes
  const updateRecipients = useCallback(
    (newRecipients: Recipient[]) => {
      setRecipients(newRecipients);
      const emailString = newRecipients
        .map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email))
        .join(', ');
      lastPropValueRef.current = emailString;
      onChange(emailString);
    },
    [onChange]
  );

  // Add one or more emails to chips
  const addRecipientsFromText = useCallback(
    (text: string) => {
      if (!text || !text.trim()) return;

      const rawItems = text
        .split(/[,;\n\r\t]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (rawItems.length === 0) return;

      const newItems: Recipient[] = rawItems.map((raw) => {
        const match = raw.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)$/);
        const name = match && match[1] ? match[1].trim() : undefined;
        const email = match && match[2] ? match[2].trim() : raw;
        const recipientId = Math.random().toString(36).substring(2, 9);
        const basicValid = EMAIL_REGEX.test(email);

        verifyEmail(email, recipientId);

        return {
          id: recipientId,
          email,
          name,
          isValid: basicValid ? null : false,
          reason: basicValid ? undefined : 'Invalid format',
        };
      });

      updateRecipients([...recipients, ...newItems]);
      setInputValue('');
      setShowSuggestions(false);
    },
    [recipients, updateRecipients, verifyEmail]
  );

  // Remove recipient chip
  const removeRecipient = useCallback(
    (idToRemove: string) => {
      const next = recipients.filter((r) => r.id !== idToRemove);
      updateRecipients(next);
      inputRef.current?.focus();
    },
    [recipients, updateRecipients]
  );

  // Filter autocomplete suggestions based on inputValue
  const filteredSuggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];

    const existingEmails = new Set(recipients.map((r) => r.email.toLowerCase()));

    return contacts
      .filter((contact) => {
        const matchesName = contact.name.toLowerCase().includes(query);
        const matchesEmail = contact.email.toLowerCase().includes(query);
        const alreadyAdded = existingEmails.has(contact.email.toLowerCase());
        return (matchesName || matchesEmail) && !alreadyAdded;
      })
      .slice(0, 6);
  }, [contacts, inputValue, recipients]);

  // Handle keyboard navigation in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Navigate suggestions
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredSuggestions[highlightedIndex];
        if (selected) {
          const recipientId = Math.random().toString(36).substring(2, 9);
          verifyEmail(selected.email, recipientId);
          updateRecipients([
            ...recipients,
            {
              id: recipientId,
              email: selected.email,
              name: selected.name,
              isValid: null,
            },
          ]);
          setInputValue('');
          setShowSuggestions(false);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    // Enter, Comma, Tab, Space creates a chip
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab' || e.key === ' ') {
      if (inputValue.trim()) {
        e.preventDefault();
        addRecipientsFromText(inputValue);
      }
      return;
    }

    // Backspace on empty input removes the last chip
    if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      const last = recipients[recipients.length - 1];
      removeRecipient(last.id);
    }
  };

  // Handle paste: parse multiple emails
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text && (text.includes(',') || text.includes(';') || text.includes('\n') || text.includes('@'))) {
      e.preventDefault();
      addRecipientsFromText(text);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Box
        ref={containerRef}
        onClick={() => inputRef.current?.focus()}
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.75,
          py: 0.75,
          px: 0.5,
          minHeight: 38,
          cursor: 'text',
          width: '100%',
        }}
      >
        {/* Recipient Chips */}
        {recipients.map((r) => {
          const isInvalid = r.isValid === false;
          const isPending = r.isValid === null;
          const displayName = r.name || r.email;
          const initial = (r.name || r.email || '?').charAt(0).toUpperCase();

          return (
            <Tooltip
              key={r.id}
              title={
                isInvalid
                  ? `Invalid address: ${r.reason || 'Domain does not exist or has no mail server'}`
                  : isPending
                  ? 'Verifying recipient address...'
                  : `${r.email}${r.name ? ` (${r.name})` : ''} - Valid recipient`
              }
              arrow
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  pl: 0.5,
                  pr: 0.75,
                  py: 0.25,
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  maxWidth: '100%',
                  transition: 'all 0.15s ease',
                  border: '1px solid',
                  borderColor: isInvalid
                    ? '#d93025' // Gmail error red
                    : isDark
                    ? 'rgba(255,255,255,0.15)'
                    : '#dadce0',
                  bgcolor: isInvalid
                    ? isDark
                      ? 'rgba(217, 48, 37, 0.15)'
                      : '#fce8e6' // Gmail invalid light red background
                    : isDark
                    ? '#2d3135'
                    : '#f1f3f4',
                  color: isInvalid
                    ? '#d93025'
                    : isDark
                    ? '#e8eaed'
                    : '#3c4043',
                  '&:hover': {
                    borderColor: isInvalid ? '#b3261e' : isDark ? '#5f6368' : '#bdc1c6',
                    boxShadow: isInvalid
                      ? '0 1px 3px rgba(217, 48, 37, 0.2)'
                      : '0 1px 3px rgba(60,64,67,0.15)',
                  },
                }}
              >
                {/* Avatar or Warning Icon */}
                {isInvalid ? (
                  <ErrorOutlineIcon
                    sx={{
                      fontSize: 16,
                      color: '#d93025',
                      ml: 0.25,
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      bgcolor: stringToColor(r.email),
                      color: '#ffffff',
                    }}
                  >
                    {initial}
                  </Avatar>
                )}

                {/* Email text */}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: isInvalid ? 600 : 500,
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'inherit',
                  }}
                >
                  {displayName}
                </Typography>

                {/* Verification Spinner */}
                {isPending && (
                  <CircularProgress
                    size={12}
                    thickness={5}
                    sx={{ color: isDark ? '#9aa0a6' : '#5f6368' }}
                  />
                )}

                {/* Remove Chip Button */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecipient(r.id);
                  }}
                  sx={{
                    p: 0.2,
                    ml: -0.25,
                    color: isInvalid ? '#d93025' : 'inherit',
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            </Tooltip>
          );
        })}

        {/* Inline Text Input */}
        <Box sx={{ flex: 1, minWidth: 140, display: 'inline-flex', alignItems: 'center' }}>
          <input
            id={id}
            ref={inputRef}
            type="text"
            value={inputValue}
            autoFocus={autoFocus}
            placeholder={recipients.length === 0 ? placeholder : ''}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => {
              setShowSuggestions(true);
              onFocus?.();
            }}
            onBlur={() => {
              // Delay hiding suggestions so clicks can register
              setTimeout(() => {
                if (inputValue.trim()) {
                  addRecipientsFromText(inputValue);
                }
                setShowSuggestions(false);
                onBlur?.();
              }, 200);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              color: isDark ? '#e8eaed' : '#202124',
              width: '100%',
              padding: '2px 0',
            }}
          />
        </Box>
      </Box>

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1500,
            mt: 0.5,
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <List dense sx={{ py: 0.5 }}>
            {filteredSuggestions.map((contact, index) => {
              const isSelected = index === highlightedIndex;
              const initial = (contact.name || contact.email || '?').charAt(0).toUpperCase();

              return (
                <ListItem
                  key={contact.email}
                  component="div"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur before click
                    const recipientId = Math.random().toString(36).substring(2, 9);
                    verifyEmail(contact.email, recipientId);
                    updateRecipients([
                      ...recipients,
                      {
                        id: recipientId,
                        email: contact.email,
                        name: contact.name,
                        isValid: null,
                      },
                    ]);
                    setInputValue('');
                    setShowSuggestions(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  sx={{
                    cursor: 'pointer',
                    py: 0.75,
                    px: 1.5,
                    bgcolor: isSelected
                      ? isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(11, 87, 208, 0.08)'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11, 87, 208, 0.08)',
                    },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 36 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        bgcolor: stringToColor(contact.email),
                        color: '#ffffff',
                      }}
                    >
                      {initial}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={contact.name || contact.email}
                    secondary={contact.name ? contact.email : undefined}
                    primaryTypographyProps={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: isDark ? '#e8eaed' : '#202124',
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: isDark ? '#9aa0a6' : '#5f6368',
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
}
