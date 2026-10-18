'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import TopHeader from '@/components/TopHeader';
import LeftSidebar from '@/components/LeftSidebar';
import CategoryTabs from '@/components/CategoryTabs';
import MailList from '@/components/MailList';
import MailReader from '@/components/MailReader';
import DockedCompose from '@/components/DockedCompose';
import SettingsDialog from '@/components/SettingsDialog';
import { FolderInfo, EmailHeader } from '@/lib/imap';

export default function MailAppPage() {
  const router = useRouter();

  const [user, setUser] = useState<{
    email: string;
    displayName: string;
    avatarUrl?: string;
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

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

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
          // Check avatar
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
      .then((res) => res.json())
      .then((data) => {
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
      .then((res) => res.json())
      .then((data) => {
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

  const handleAction = async (action: string, uids: number[]) => {
    try {
      const res = await fetch('/api/mail/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, uids, folder: currentFolder }),
      });
      if (res.ok) {
        setToastMsg(`Action ${action} succeeded`);
        setToastSeverity('success');
        fetchMessages();
        fetchFolders();
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

  const handleOpenCompose = (to = '', subject = '', body = '') => {
    setComposeTo(to);
    setComposeSubject(subject);
    setComposeBody(body);
    setComposeOpen(true);
  };

  if (loadingSession || !user) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f6f8fc',
        }}
      >
        <CircularProgress size={44} sx={{ color: '#0b57d0' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', bgcolor: '#f6f8fc' }}>
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
          onOpenCompose={() => handleOpenCompose()}
          collapsed={sidebarCollapsed}
        />

        {/* Content Pane: Mailbox Container with 16px rounded borders like Google Workspace */}
        <Box
          sx={{
            flex: 1,
            m: 1,
            ml: 0,
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {selectedMessage ? (
            /* Single-Pane Reader View */
            <MailReader
              messageHeader={selectedMessage}
              currentFolder={currentFolder}
              onBack={() => {
                setSelectedMessage(null);
                fetchMessages();
                fetchFolders();
              }}
              onReply={(to, subject, quoteBody) => handleOpenCompose(to, subject, quoteBody)}
              onForward={(subject, quoteBody) => handleOpenCompose('', subject, quoteBody)}
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
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSendSuccess={() => {
          setToastMsg('Message sent successfully!');
          setToastSeverity('success');
          fetchMessages();
          fetchFolders();
        }}
        initialTo={composeTo}
        initialSubject={composeSubject}
        initialBody={composeBody}
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
