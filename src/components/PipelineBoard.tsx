'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import CrmSidebar from '@/components/CrmSidebar';
import { Deal, Pipeline } from '@/lib/crm';

interface PipelineBoardProps {
  pipelineId?: string;
  onOpenMessage?: (messageId: string) => void;
}

export default function PipelineBoard({
  pipelineId,
  onOpenMessage,
}: PipelineBoardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Active deal selected for right CRM drawer
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [crmDrawerOpen, setCrmDrawerOpen] = useState(false);

  // New deal modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newDealValue, setNewDealValue] = useState('0');
  const [newStageId, setNewStageId] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPipelinesAndDeals = async () => {
    setLoading(true);
    try {
      const pRes = await fetch('/api/crm/pipelines');
      const pData = await pRes.json();
      if (pData.pipelines && pData.pipelines.length > 0) {
        setPipelines(pData.pipelines);
        const active =
          pData.pipelines.find((p: Pipeline) => p.id === pipelineId) ||
          pData.pipelines[0];
        setPipeline(active);
        if (active && active.stages.length > 0) {
          setNewStageId(active.stages[0].id);
        }

        const dRes = await fetch(`/api/crm/deals?pipelineId=${active.id}`);
        const dData = await dRes.json();
        if (dData.deals) {
          setDeals(dData.deals);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelinesAndDeals();
  }, [pipelineId]);

  const handleMoveStage = async (dealId: string, targetStageId: string) => {
    try {
      const res = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: targetStageId }),
      });
      const data = await res.json();
      if (data.deal) {
        setDeals((prev) => prev.map((d) => (d.id === dealId ? data.deal : d)));
        if (selectedDeal?.id === dealId) setSelectedDeal(data.deal);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    try {
      const res = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeals((prev) => prev.filter((d) => d.id !== dealId));
        if (selectedDeal?.id === dealId) {
          setSelectedDeal(null);
          setCrmDrawerOpen(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDeal = async () => {
    if (!newTitle.trim() || !newContactEmail.trim() || !pipeline) return;
    setCreating(true);
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          contactEmail: newContactEmail.trim(),
          contactName: newContactName.trim() || undefined,
          pipelineId: pipeline.id,
          stageId: newStageId || pipeline.stages[0]?.id || 'lead',
          dealValue: parseFloat(newDealValue) || 0,
        }),
      });
      const data = await res.json();
      if (data.deal) {
        setDeals((prev) => [data.deal, ...prev]);
        setCreateOpen(false);
        setNewTitle('');
        setNewContactEmail('');
        setNewContactName('');
        setNewDealValue('0');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  // Calculate totals
  const totalValue = deals.reduce((sum, d) => sum + (d.dealValue || 0), 0);

  return (
    <Box sx={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main Kanban Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Kanban Top Header */}
        <Box
          sx={{
            height: 56,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkOutlineIcon sx={{ color: '#f97316', fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                {pipeline?.name || 'Sales Pipeline'}
              </Typography>
            </Box>

            <Chip
              size="small"
              label={`${deals.length} deals`}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
            <Chip
              size="small"
              label={`Total: $${totalValue.toLocaleString()}`}
              sx={{
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7',
                color: isDark ? '#4ade80' : '#15803d',
                fontSize: '0.75rem',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh Deals">
              <IconButton size="small" onClick={fetchPipelinesAndDeals} sx={{ color: theme.palette.text.secondary }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{
                bgcolor: '#f97316',
                '&:hover': { bgcolor: '#ea580c' },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '16px',
                px: 2,
              }}
            >
              + New Box / Deal
            </Button>
          </Box>
        </Box>

        {/* Board Columns Area */}
        <Box
          sx={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            p: 2.5,
            display: 'flex',
            gap: 2,
            backgroundColor: isDark ? '#141414' : '#f8fafd',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <CircularProgress size={36} sx={{ color: '#f97316' }} />
            </Box>
          ) : !pipeline ? (
            <Box sx={{ p: 4, textAlign: 'center', flex: 1 }}>
              <Typography variant="body1">No pipeline found.</Typography>
            </Box>
          ) : (
            pipeline.stages.map((stage, stageIdx) => {
              const stageDeals = deals.filter((d) => d.stageId === stage.id);
              const stageValue = stageDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);

              return (
                <Box
                  key={stage.id}
                  sx={{
                    width: 290,
                    minWidth: 290,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '100%',
                    backgroundColor: isDark ? '#1e1f20' : '#ffffff',
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: isDark
                      ? '0 2px 8px rgba(0,0,0,0.4)'
                      : '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Column Stage Header */}
                  <Box
                    sx={{
                      p: 1.5,
                      px: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      borderTop: `4px solid ${stage.color}`,
                      borderTopLeftRadius: '16px',
                      borderTopRightRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: stage.color,
                        }}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {stage.name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                        ${stageValue.toLocaleString()}
                      </Typography>
                      <Chip
                        size="small"
                        label={stageDeals.length}
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Deals Card Column List */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      p: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    {stageDeals.length === 0 ? (
                      <Box
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          border: `1px dashed ${theme.palette.divider}`,
                          borderRadius: '10px',
                          color: theme.palette.text.secondary,
                        }}
                      >
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          No deals in {stage.name}
                        </Typography>
                      </Box>
                    ) : (
                      stageDeals.map((deal) => {
                        const isSelected = selectedDeal?.id === deal.id;
                        return (
                          <Box
                            key={deal.id}
                            onClick={() => {
                              setSelectedDeal(deal);
                              setCrmDrawerOpen(true);
                            }}
                            sx={{
                              p: 1.8,
                              borderRadius: '12px',
                              backgroundColor: isDark ? '#27282b' : '#ffffff',
                              border: `1px solid ${
                                isSelected
                                  ? '#f97316'
                                  : isDark
                                  ? 'rgba(255,255,255,0.08)'
                                  : 'rgba(0,0,0,0.08)'
                              }`,
                              boxShadow: isSelected
                                ? '0 0 0 2px rgba(249, 115, 22, 0.4)'
                                : '0 1px 3px rgba(0,0,0,0.04)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                borderColor: '#f97316',
                              },
                            }}
                          >
                            {/* Deal Title */}
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                mb: 0.8,
                                wordBreak: 'break-word',
                                color: theme.palette.text.primary,
                              }}
                            >
                              {deal.title}
                            </Typography>

                            {/* Contact Info */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                              <PersonOutlineIcon sx={{ fontSize: 15, color: theme.palette.text.secondary }} />
                              <Typography variant="caption" noWrap sx={{ color: theme.palette.text.secondary }}>
                                {deal.contactName ? `${deal.contactName} (${deal.contactEmail})` : deal.contactEmail}
                              </Typography>
                            </Box>

                            {/* Deal Value & Task Summary */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                              <Chip
                                size="small"
                                label={`$${(deal.dealValue || 0).toLocaleString()}`}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 22,
                                  bgcolor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#f0fdf4',
                                  color: isDark ? '#4ade80' : '#16a34a',
                                  border: '1px solid rgba(22, 163, 74, 0.3)',
                                }}
                              />

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {deal.tasks && deal.tasks.length > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                    <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>
                                      {deal.tasks.filter((t) => t.completed).length}/{deal.tasks.length}
                                    </Typography>
                                  </Box>
                                )}
                                {deal.notes && deal.notes.length > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                    <NoteAltOutlinedIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>
                                      {deal.notes.length}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>

                            {/* Quick Stage Move Buttons */}
                            <Box
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mt: 1.5,
                                pt: 1,
                                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                              }}
                            >
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {stageIdx > 0 && (
                                  <Tooltip title={`Move back to ${pipeline.stages[stageIdx - 1].name}`}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleMoveStage(deal.id, pipeline.stages[stageIdx - 1].id)}
                                      sx={{ p: 0.4 }}
                                    >
                                      <ArrowBackIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {stageIdx < pipeline.stages.length - 1 && (
                                  <Tooltip title={`Advance to ${pipeline.stages[stageIdx + 1].name}`}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleMoveStage(deal.id, pipeline.stages[stageIdx + 1].id)}
                                      sx={{ p: 0.4, color: '#f97316' }}
                                    >
                                      <ArrowForwardIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>

                              <Tooltip title="Delete Deal">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteDeal(deal.id)}
                                  sx={{ p: 0.4, color: theme.palette.text.secondary }}
                                >
                                  <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Right CrmSidebar Drawer for Selected Deal */}
      <CrmSidebar
        open={crmDrawerOpen}
        onClose={() => setCrmDrawerOpen(false)}
        deal={selectedDeal}
        pipeline={pipeline}
        onUpdateDeal={(updated) => {
          setSelectedDeal(updated);
          setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        }}
      />

      {/* Create New Deal / Box Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkOutlineIcon sx={{ color: '#f97316' }} />
          Create Streak CRM Box
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              size="small"
              label="Deal / Box Title"
              fullWidth
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Acme Corp Enterprise Deal"
            />
            <TextField
              size="small"
              label="Contact Email"
              type="email"
              fullWidth
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              placeholder="lead@company.com"
            />
            <TextField
              size="small"
              label="Contact Name (Optional)"
              fullWidth
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="John Doe"
            />
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block', mb: 0.5 }}>
                Stage
              </Typography>
              <Select
                size="small"
                fullWidth
                value={newStageId || pipeline?.stages[0]?.id || ''}
                onChange={(e) => setNewStageId(e.target.value)}
              >
                {pipeline?.stages.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: st.color }} />
                      <Typography variant="body2">{st.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <TextField
              size="small"
              label="Deal Value ($ USD)"
              type="number"
              fullWidth
              value={newDealValue}
              onChange={(e) => setNewDealValue(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ borderRadius: '16px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateDeal}
            disabled={creating || !newTitle.trim() || !newContactEmail.trim()}
            variant="contained"
            sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, borderRadius: '16px' }}
          >
            Create Deal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
