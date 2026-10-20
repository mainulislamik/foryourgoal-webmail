'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TopHeader from '@/components/TopHeader';
import LeftSidebar from '@/components/LeftSidebar';
import CategoryTabs from '@/components/CategoryTabs';
import MailList from '@/components/MailList';
import MailReader from '@/components/MailReader';
import DockedCompose from '@/components/DockedCompose';
import SettingsDialog from '@/components/SettingsDialog';
import { FolderInfo, EmailHeader } from '@/lib/imap';
import { useThemeMode } from '@/contexts/ThemeContext';

export default function MailAppPage() {
  const router = useRouter();
  const theme = useTheme();
  const { signature } = useThemeMode();

  const [user, setUser] = useState<{
    email: string;
    displayName: string;
    avatarUrl?: string;
    isMasterAuth?: boolean;
    impersonatedBy?: string;
  } | null>(null);

  const [loadingSession, setLoadingSession] = useState(true);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [currentCategory, setCurrentCategory] = useState('primary');
  const [messages, setMessages] = useState<EmailHeader[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reader state
  const [selectedMessage, setSelectedMessage] = useState<EmailHeader | null>(null);
  const [detailMessage, setDetailMessage] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Compose state
  const [composeState, setComposeState] = useState<{
    open: boolean;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
  }>({
    open: false,
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  });

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('success');

  // Check auth session
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          fetch(`/api/profile/avatar?email=${encodeURIComponent(data.user.email)}`)
            .then((r) => r.json())
            .then((av) => {
              if (av.avatarUrl) {
                setUser((prev) => (prev ? { ...prev, avatarUrl: av.avatarUrl } : null));
              }
            })
            .catch(() => {});
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setLoadingSession(false);
      });
  }, [router]);

  // Fetch folders
  const fetchFolders = useCallback(() => {
    fetch('/api/mail/folders')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.isAuthFailed || (data.error && data.error.includes('Authentication failed'))) {
          window.location.href = '/login';
          return;
        }
        if (data.folders) {
          setFolders(data.folders);
        }
      })
      .catch((err) => console.error('Error fetching folders:', err));
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(() => {
    setLoadingMessages(true);
    const params = new URLSearchParams({
      folder: currentFolder,
      category: currentCategory,
    });
    if (searchQuery) {
      params.append('q', searchQuery);
    }

    fetch(`/api/mail/messages?${params.toString()}`)
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.isAuthFailed || (data.error && data.error.includes('Authentication failed'))) {
          window.location.href = '/login';
          return;
        }
        if (data.messages) {
          setMessages(data.messages);
        }
      })
      .catch((err) => console.error('Error fetching messages:', err))
      .finally(() => {
        setLoadingMessages(false);
      });
  }, [currentFolder, currentCategory, searchQuery]);

  useEffect(() => {
    if (user) {
      fetchFolders();
      fetchMessages();
    }
  }, [user, fetchFolders, fetchMessages]);

  // Fetch detailed email when selected
  useEffect(() => {
    if (!selectedMessage) {
      setDetailMessage(null);
      return;
    }
    setLoadingDetail(true);
    fetch(`/api/mail/message/${selectedMessage.uid}?folder=${encodeURIComponent(currentFolder)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setDetailMessage(data.message);
        }
      })
      .catch((err) => console.error('Error fetching message detail:', err))
      .finally(() => {
        setLoadingDetail(false);
      });
  }, [selectedMessage, currentFolder]);

  // Gmail Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setComposeState({ open: true, to: '', subject: '', body: '' });
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('mail-search-input')?.focus();
      } else if (e.key === 'Escape') {
        if (composeState.open) {
          setComposeState((prev) => ({ ...prev, open: false }));
        } else if (settingsOpen) {
          setSettingsOpen(false);
        } else if (selectedMessage) {
          setSelectedMessage(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [composeState.open, settingsOpen, selectedMessage]);

  const handleAction = async (action: string, uids: number[], destinationFolder?: string) => {
    try {
      const res = await fetch('/api/mail/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, uids, folder: currentFolder, destinationFolder }),
      });
      if (res.ok) {
        setToastMsg(`Action ${action} succeeded`);
        setToastSeverity('success');
        fetchMessages();
        fetchFolders();
        if (action === 'delete' || action === 'archive' || action === 'move' || action === 'emptyFolder') {
          setSelectedMessage(null);
        }
      }
    } catch (e) {
      setToastMsg('Failed to perform action');
      setToastSeverity('error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleSendMail = async (data: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    attachments?: Array<{ filename: string; content: string; contentType: string; size: number }>;
    priority?: 'high' | 'normal';
    requestReadReceipt?: boolean;
  }) => {
    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setToastMsg('Message sent successfully!');
        setToastSeverity('success');
        setComposeState({ open: false, to: '', subject: '', body: '' });
        fetchMessages();
        fetchFolders();
      } else {
        const errData = await res.json();
        setToastMsg(errData.error || 'Failed to send message');
        setToastSeverity('error');
      }
    } catch (e) {
      setToastMsg('Error sending email');
      setToastSeverity('error');
    }
  };

  if (loadingSession || !user) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.background.default,
        }}
      >
        <CircularProgress size={44} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Admin SSO banner */}
      {(user.isMasterAuth || user.impersonatedBy) && (
        <Box
          sx={{
            bgcolor: '#1a73e8',
            color: '#fff',
            px: 2,
            py: 0.75,
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 1300,
          }}
        >
          <span>
            Admin Direct Access: Logged in as <strong>{user.email}</strong>
            {' '}(via {user.impersonatedBy || 'Admin Console'})
          </span>
          <a
            href="https://admin.foryourgoal.com/users"
            style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline', marginLeft: 'auto' }}
          >
            Return to Admin
          </a>
        </Box>
      )}
      {/* Google Workspace Header */}
      <TopHeader
        user={user}
        onSearch={(q) => {
          setSearchQuery(q);
          setSelectedMessage(null);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Mail Surface */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Navigation Sidebar */}
        <LeftSidebar
          currentFolder={currentFolder}
          folders={folders}
          onSelectFolder={(folder) => {
            setCurrentFolder(folder);
            setSelectedMessage(null);
          }}
          onOpenCompose={() =>
            setComposeState({ open: true, to: '', subject: '', body: '' })
          }
          onComposeContact={(email) =>
            setComposeState({ open: true, to: email, subject: '', body: '' })
          }
          onRefreshFolders={() => fetchFolders()}
          collapsed={sidebarCollapsed}
        />

        {/* Content Pane: Rounded card layout */}
        <Box
          sx={{
            flex: 1,
            m: 1,
            ml: 0,
            borderRadius: '16px',
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {selectedMessage ? (
            /* Single-Pane Reader View */
            <MailReader
              message={selectedMessage}
              detail={detailMessage}
              loading={loadingDetail}
              currentFolder={currentFolder}
              folders={folders}
              onBack={() => {
                setSelectedMessage(null);
                fetchMessages();
                fetchFolders();
              }}
              onReply={(smartText?: string) => {
                const replyTo = selectedMessage.from[0]?.address || '';
                const replySub = selectedMessage.subject.startsWith('Re:')
                  ? selectedMessage.subject
                  : `Re: ${selectedMessage.subject}`;
                setComposeState({
                  open: true,
                  to: replyTo,
                  subject: replySub,
                  body: smartText ? `<p>${smartText}</p>` : `<br><br><div style="border-left: 2px solid #0284c7; padding-left: 10px; margin-left: 5px; color: #555;">On ${selectedMessage.date}, &lt;${replyTo}&gt; wrote:<br>${detailMessage?.html || detailMessage?.text || ''}</div>`,
                });
              }}
              onReplyAll={() => {
                const replyTo = selectedMessage.from[0]?.address || '';
                const currentUserEmail = user?.email?.toLowerCase() || '';
                const allCc: string[] = [];
                if (selectedMessage.to) {
                  selectedMessage.to.forEach((t) => {
                    if (t.address && t.address.toLowerCase() !== currentUserEmail && t.address.toLowerCase() !== replyTo.toLowerCase()) {
                      allCc.push(t.address);
                    }
                  });
                }
                if (detailMessage?.cc) {
                  detailMessage.cc.forEach((c: { name?: string; address: string }) => {
                    if (c.address && c.address.toLowerCase() !== currentUserEmail && c.address.toLowerCase() !== replyTo.toLowerCase()) {
                      allCc.push(c.address);
                    }
                  });
                }
                const replySub = selectedMessage.subject.startsWith('Re:')
                  ? selectedMessage.subject
                  : `Re: ${selectedMessage.subject}`;
                setComposeState({
                  open: true,
                  to: replyTo,
                  cc: [...new Set(allCc)].join(', '),
                  subject: replySub,
                  body: `<br><br><div style="border-left: 2px solid #0284c7; padding-left: 10px; margin-left: 5px; color: #555;">On ${selectedMessage.date}, &lt;${replyTo}&gt; wrote:<br>${detailMessage?.html || detailMessage?.text || ''}</div>`,
                });
              }}
              onForward={() => {
                const fwdSub = selectedMessage.subject.startsWith('Fwd:')
                  ? selectedMessage.subject
                  : `Fwd: ${selectedMessage.subject}`;
                setComposeState({
                  open: true,
                  to: '',
                  subject: fwdSub,
                  body: `<br><br>---------- Forwarded message ---------<br>From: ${
                    selectedMessage.from[0]?.name || ''
                  } &lt;${selectedMessage.from[0]?.address || ''}&gt;<br>Subject: ${
                    selectedMessage.subject
                  }<br><br>${detailMessage?.html || detailMessage?.text || ''}`,
                });
              }}
              onAction={handleAction}
            />
          ) : (
            /* Mail List View */
            <>
              {currentFolder.toUpperCase() === 'INBOX' && (
                <CategoryTabs
                  currentCategory={currentCategory}
                  onSelectCategory={(cat) => setCurrentCategory(cat)}
                />
              )}
              <MailList
                messages={messages}
                loading={loadingMessages}
                currentFolder={currentFolder}
                folders={folders}
                onSelectMessage={(msg) => setSelectedMessage(msg)}
                onRefresh={() => {
                  fetchMessages();
                  fetchFolders();
                }}
                onAction={handleAction}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Docked Floating Compose Window */}
      <DockedCompose
        state={composeState}
        onClose={() => setComposeState((prev) => ({ ...prev, open: false }))}
        onSend={handleSendMail}
        signature={signature}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Profile & Avatar Settings Modal */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        onAvatarUpdated={(newUrl) => {
          setUser((prev) => (prev ? { ...prev, avatarUrl: newUrl } : null));
        }}
      />

      {/* Notification Toast */}
      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={4000}
        onClose={() => setToastMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setToastMsg('')}
          severity={toastSeverity}
          sx={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
