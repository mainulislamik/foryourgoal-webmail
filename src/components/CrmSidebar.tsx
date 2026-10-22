'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  Button,
  Chip,
  Select,
  MenuItem,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import { Deal, Pipeline } from '@/lib/crm';
import { TrackingRecord } from '@/lib/tracking';

interface CrmSidebarProps {
  open: boolean;
  onClose: () => void;
  deal: Deal | null;
  pipeline: Pipeline | null;
  trackingRecord?: TrackingRecord | null;
  onUpdateDeal: (updatedDeal: Deal) => void;
  onCreateDeal?: () => void;
}

export default function CrmSidebar({
  open,
  onClose,
  deal,
  pipeline,
  trackingRecord,
  onUpdateDeal,
  onCreateDeal,
}: CrmSidebarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [saving, setSaving] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editValue, setEditValue] = useState<string>(deal?.dealValue ? String(deal.dealValue) : '0');

  if (!open) return null;

  const handleStageChange = async (newStageId: string) => {
    if (!deal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: newStageId }),
      });
      const data = await res.json();
      if (data.deal) {
        onUpdateDeal(data.deal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleValueBlur = async () => {
    if (!deal) return;
    const num = parseFloat(editValue) || 0;
    if (num === deal.dealValue) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealValue: num }),
      });
      const data = await res.json();
      if (data.deal) {
        onUpdateDeal(data.deal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!deal || !newNoteText.trim()) return;
    setSaving(true);
    try {
      const newNote = {
        id: 'note_' + Math.random().toString(36).substr(2, 9),
        text: newNoteText.trim(),
        createdAt: new Date().toISOString(),
      };
      const updatedNotes = [newNote, ...(deal.notes || [])];
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes }),
      });
      const data = await res.json();
      if (data.deal) {
        onUpdateDeal(data.deal);
        setNewNoteText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!deal) return;
    setSaving(true);
    try {
      const updatedNotes = (deal.notes || []).filter((n) => n.id !== noteId);
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes }),
      });
      const data = await res.json();
      if (data.deal) {
        onUpdateDeal(data.deal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async () => {
    if (!deal || !newTaskTitle.trim()) return;
    setSaving(true);
    try {
      const newTask = {
        id: 'task_' + Math.random().toString(36).substr(2, 9),
        title: newTaskTitle.trim(),
        completed: false,
      };
      const updatedTasks = [...(deal.tasks || []), newTask];
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
      const data = await res.json();
      if (data.deal) {
        onUpdateDeal(data.deal);
        setNewTaskTitle('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!deal) return;
    setSaving(true);
    try {
      const updatedTasks = (deal.tasks || []).map((t) =>
        t.id === taskId ? { ...t, completed } : t
      );
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
      const data = await res.json();
      if (data.deal) {
        onUpdateDeal(data.deal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!deal) return;
    setSaving(true);
    try {
      const updatedTasks = (deal.tasks || []).filter((t) => t.id !== taskId);
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
      const data = await res.json();
      if (data.deal) {
        onUpdateDeal(data.deal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const currentStage = pipeline?.stages.find((s) => s.id === deal?.stageId);

  return (
    <Box
      sx={{
        width: 360,
        minWidth: 360,
        height: '100%',
        borderLeft: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isDark ? '-4px 0 16px rgba(0,0,0,0.4)' : '-2px 0 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkOutlineIcon sx={{ color: '#f97316', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Streak CRM Box
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {saving && <CircularProgress size={16} sx={{ mr: 1, color: '#f97316' }} />}
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Body Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        {!deal ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <WorkOutlineIcon sx={{ fontSize: 44, color: theme.palette.text.secondary, mb: 1.5, opacity: 0.6 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              No CRM Deal Linked
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
              Add this conversation to your sales pipeline to track deals, stages, notes, and tasks.
            </Typography>
            {onCreateDeal && (
              <Button
                variant="contained"
                size="small"
                onClick={onCreateDeal}
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: '#f97316',
                  '&:hover': { bgcolor: '#ea580c' },
                  textTransform: 'none',
                  borderRadius: '20px',
                  px: 2,
                }}
              >
                + Add to Pipeline
              </Button>
            )}
          </Box>
        ) : (
          <>
            {/* Deal Title */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                DEAL / BOX NAME
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5, wordBreak: 'break-word' }}>
                {deal.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#f97316', fontWeight: 600 }}>
                Pipeline: {pipeline?.name || 'Sales Leads'}
              </Typography>
            </Box>

            {/* Stage Selector */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block', mb: 0.5 }}>
                STAGE
              </Typography>
              <Select
                size="small"
                fullWidth
                value={deal.stageId || pipeline?.stages[0]?.id || ''}
                onChange={(e) => handleStageChange(e.target.value)}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 600,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                }}
              >
                {pipeline?.stages.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: st.color,
                        }}
                      />
                      <span>{st.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Deal Value */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block', mb: 0.5 }}>
                DEAL VALUE ($ USD)
              </Typography>
              <TextField
                size="small"
                fullWidth
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleValueBlur}
                InputProps={{
                  startAdornment: <AttachMoneyIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 0.5 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                  },
                }}
              />
            </Box>

            {/* Contact Details */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block', mb: 1 }}>
                CONTACT INFORMATION
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PersonOutlineIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {deal.contactName || 'No Name'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailOutlinedIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {deal.contactEmail}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Streak Email Tracking in Deal */}
            {trackingRecord && (
              <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VisibilityIcon sx={{ fontSize: 18, color: trackingRecord.openCount > 0 ? '#16a34a' : theme.palette.text.secondary }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                    EMAIL TRACKING (STREAK)
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '10px',
                    bgcolor: trackingRecord.openCount > 0 ? (isDark ? 'rgba(22, 163, 74, 0.15)' : '#f0fdf4') : (isDark ? 'rgba(255,255,255,0.03)' : '#fafafa'),
                    border: `1px solid ${trackingRecord.openCount > 0 ? 'rgba(22, 163, 74, 0.3)' : theme.palette.divider}`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: trackingRecord.openCount > 0 ? '#16a34a' : theme.palette.text.secondary }}>
                    {trackingRecord.openCount > 0
                      ? `Read ${trackingRecord.openCount} time${trackingRecord.openCount > 1 ? 's' : ''}`
                      : 'Not opened yet'}
                  </Typography>
                  {trackingRecord.lastOpenedAt && (
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>
                      Last read: {new Date(trackingRecord.lastOpenedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Tasks Section */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                    TASKS ({deal.tasks?.length || 0})
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add a task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddTask}
                  sx={{ borderRadius: '8px', minWidth: 40, px: 1.5 }}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {deal.tasks?.map((t) => (
                  <Box
                    key={t.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: '8px',
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                      <Checkbox
                        size="small"
                        checked={t.completed}
                        onChange={(e) => handleToggleTask(t.id, e.target.checked)}
                        sx={{ p: 0.2 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: t.completed ? 'line-through' : 'none',
                          color: t.completed ? theme.palette.text.secondary : theme.palette.text.primary,
                          wordBreak: 'break-word',
                        }}
                      >
                        {t.title}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleDeleteTask(t.id)}>
                      <DeleteOutlineIcon fontSize="small" sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Notes Section */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                <NoteAltOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                  INTERNAL NOTES ({deal.notes?.length || 0})
                </Typography>
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Add a private note about this deal..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddNote}
                  sx={{
                    mt: 1,
                    borderRadius: '8px',
                    textTransform: 'none',
                    bgcolor: '#0284c7',
                    '&:hover': { bgcolor: '#0369a1' },
                  }}
                >
                  Save Note
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {deal.notes?.map((n) => (
                  <Box
                    key={n.id}
                    sx={{
                      p: 1.5,
                      borderRadius: '8px',
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafd',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      <IconButton size="small" onClick={() => handleDeleteNote(n.id)}>
                        <DeleteOutlineIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {n.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
