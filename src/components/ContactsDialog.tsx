'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const STORAGE_KEY = 'foryourgoal_contacts';

export interface Contact {
  id: string;
  name: string;
  email: string;
  organization: string;
  phone: string;
  notes: string;
}

const emptyForm = (): Omit<Contact, 'id'> => ({
  name: '',
  email: '',
  organization: '',
  phone: '',
  notes: '',
});

interface ContactsDialogProps {
  open: boolean;
  onClose: () => void;
  onComposeContact: (email: string) => void;
}

export default function ContactsDialog({ open, onClose, onComposeContact }: ContactsDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setContacts(raw ? JSON.parse(raw) : []);
      } catch {
        setContacts([]);
      }
    }
  }, [open]);

  const persist = (updated: Contact[]) => {
    setContacts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('A valid email is required.');
      return;
    }
    const newContact: Contact = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: form.name.trim(),
      email: form.email.trim(),
      organization: form.organization.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
    };
    persist([...contacts, newContact]);
    setForm(emptyForm());
    setFormError('');
    setAddOpen(false);
  };

  const handleDelete = (id: string) => {
    persist(contacts.filter((c) => c.id !== id));
  };

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.organization.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 0, overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            fontWeight: 600,
            fontSize: '1.1rem',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonOutlineIcon sx={{ fontSize: 22, color: theme.palette.primary.main }} />
            Contacts
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Add contact">
              <IconButton
                size="small"
                onClick={() => { setAddOpen(true); setFormError(''); setForm(emptyForm()); }}
                sx={{
                  backgroundColor: '#c2e7ff',
                  color: '#001d35',
                  borderRadius: '12px',
                  px: 1.5,
                  '&:hover': { backgroundColor: '#b3d7ff' },
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '24px' },
            }}
          />
        </Box>

        <DialogContent sx={{ px: 2, pt: 1, pb: 2, minHeight: 240 }}>
          {filtered.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                color: theme.palette.text.secondary,
                gap: 1,
              }}
            >
              <PersonOutlineIcon sx={{ fontSize: 40, opacity: 0.4 }} />
              <Typography variant="body2">
                {search ? 'No contacts match your search.' : 'No contacts yet. Add one!'}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filtered.map((contact, idx) => (
                <React.Fragment key={contact.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItem
                    disablePadding
                    sx={{
                      py: 1.2,
                      px: 1,
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: isDark ? '#2b2d30' : '#f5f5f5',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#004a77' : '#c2e7ff',
                        color: isDark ? '#a8c7fa' : '#001d35',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </Box>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {contact.name}
                        </Typography>
                      }
                      secondary={
                        <Box component="span">
                          <Typography variant="caption" display="block" noWrap sx={{ color: theme.palette.text.secondary }}>
                            {contact.email}
                          </Typography>
                          {contact.organization && (
                            <Typography variant="caption" display="block" noWrap sx={{ color: theme.palette.text.secondary }}>
                              {contact.organization}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title={`Email ${contact.email}`}>
                        <IconButton
                          size="small"
                          onClick={() => { onComposeContact(contact.email); onClose(); }}
                          sx={{ color: theme.palette.primary.main, mr: 0.5 }}
                        >
                          <EmailOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete contact">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(contact.id)}
                          sx={{ color: theme.palette.error.main }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Add Contact</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {formError && (
            <Typography variant="caption" color="error">
              {formError}
            </Typography>
          )}
          <TextField
            label="Name *"
            fullWidth
            size="small"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
          />
          <TextField
            label="Email *"
            fullWidth
            size="small"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            label="Organization"
            fullWidth
            size="small"
            value={form.organization}
            onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
          />
          <TextField
            label="Phone"
            fullWidth
            size="small"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <TextField
            label="Notes"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setAddOpen(false)}
            sx={{ borderRadius: '20px', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            sx={{ borderRadius: '20px', textTransform: 'none' }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
