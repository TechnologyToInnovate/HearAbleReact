import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- ADMIN ANNOUNCEMENT STATE ---
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annLink, setAnnLink] = useState('');
  const [annTarget, setAnnTarget] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [annMsg, setAnnMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (role === 'guest' || role === 'needs_onboarding') {
      navigate('/');
      return;
    }
    if (user) fetchNotifications();
  }, [user, role, navigate]);

  async function fetchNotifications() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setNotifications(data);
    setIsLoading(false);
  }

  async function handleMarkAsRead(id) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) {
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
    if (!error) setNotifications([]);
  }

  async function handleNotificationClick(notification) {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

  // 🚨 ADMIN BROADCAST FUNCTION
  async function handleSendAnnouncement(e) {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to send this announcement to ${annTarget === 'all' ? 'everyone' : annTarget}?`)) return;
    
    setIsSending(true);
    setAnnMsg({ type: '', text: '' });

    const { error } = await supabase.rpc('admin_create_announcement', {
      announcement_title: annTitle.trim(),
      announcement_message: annMessage.trim(),
      announcement_link: annLink.trim() || null,
      target_audience: annTarget
    });

    setIsSending(false);

    if (error) {
      setAnnMsg({ type: 'error', text: 'Failed to broadcast announcement: ' + error.message });
    } else {
      setAnnMsg({ type: 'success', text: 'Announcement successfully broadcasted! 🚀' });
      setAnnTitle('');
      setAnnMessage('');
      setAnnLink('');
      setAnnTarget('all');
      
      // Refresh the admin's own notifications so they can see the blast instantly
      fetchNotifications();
    }
  }

  const renderMessage = (msgObj) => {
    if (!msgObj.text) return null;
    const isError = msgObj.type === 'error';
    return (
      <div style={{ 
        padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem',
        background: isError ? '#fef2f2' : '#f0fdf4', 
        color: isError ? '#991b1b' : '#166534', 
        border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}` 
      }}>
        {msgObj.text}
      </div>
    );
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      
      {/* 🚨 THE ADMIN ANNOUNCEMENT BLOCK (Only visible to admins) */}
      {role === 'admin' && (
        <div className="card p-0 mb-32" style={{ overflow: 'hidden', border: '1px solid var(--primary-color)' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
            <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📢</span> Send Global Announcement
            </h2>
            <p className="text-secondary m-0">Push an alert directly to the notification inbox of specific user groups.</p>
          </div>

          <div style={{ padding: '32px' }}>
            {renderMessage(annMsg)}
            
            <form onSubmit={handleSendAnnouncement} className="flex-col gap-16">
              <div className="form-grid-2">
                <div>
                  <label>Announcement Title *</label>
                  <input 
                    type="text" 
                    className="search-input w-full" 
                    placeholder="e.g. Platform Update, New Features..." 
                    value={annTitle} 
                    onChange={e => setAnnTitle(e.target.value)} 
                    required
                  />
                </div>
                <div>
                  <label>Target Audience *</label>
                  <select className="search-input w-full" value={annTarget} onChange={e => setAnnTarget(e.target.value)}>
                    <option value="all">Everyone (All Accounts)</option>
                    <option value="applicants">Applicants Only</option>
                    <option value="companies">Companies Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label>Message *</label>
                <textarea 
                  className="search-input w-full" 
                  placeholder="What do you want to tell them?" 
                  value={annMessage} 
                  onChange={e => setAnnMessage(e.target.value)} 
                  style={{ height: '100px', resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label>Link (Optional)</label>
                <input 
                  type="text" 
                  className="search-input w-full" 
                  placeholder="e.g. /jobs, /settings, or https://..." 
                  value={annLink} 
                  onChange={e => setAnnLink(e.target.value)} 
                />
              </div>
              
              <div className="mt-8">
                <button type="submit" className="btn-black" disabled={isSending}>
                  {isSending ? 'Broadcasting...' : '🚀 Send Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- INBOX SECTION --- */}
      <div className="flex-between align-center mb-24">
        <h1 className="m-0">{role === 'admin' ? 'Your Notifications' : 'Notifications'}</h1>
        {notifications.length > 0 && (
          <button 
            className="btn-outline btn-sm" 
            onClick={handleClearAll} 
            style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
          >
            Clear All
          </button>
        )}
      </div>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <p className="text-center text-secondary p-32 m-0">Loading your notifications...</p>
        ) : notifications.length > 0 ? (
          <div className="flex-col">
            {notifications.map((notif, index) => (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                style={{ 
                  padding: '20px 24px', 
                  borderBottom: index !== notifications.length - 1 ? '1px solid var(--border-color)' : 'none',
                  backgroundColor: notif.is_read ? 'transparent' : 'var(--bg-color)',
                  cursor: notif.link ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  gap: '16px'
                }}
              >
                {/* Unread indicator dot */}
                <div style={{ flexShrink: 0, marginTop: '6px' }}>
                  <span style={{ 
                    display: 'block', 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: notif.is_read ? 'transparent' : 'var(--primary-color)' 
                  }}></span>
                </div>
                
                <div className="w-full">
                  <div className="flex-between-start mb-8">
                    <h4 className="m-0" style={{ fontWeight: notif.is_read ? '500' : '700' }}>
                      {notif.title}
                    </h4>
                    <span className="text-sm text-secondary" style={{ whiteSpace: 'nowrap', marginLeft: '16px' }}>
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-secondary m-0" style={{ lineHeight: '1.5' }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-32">
            <div className="text-3xl mb-16">📭</div>
            <h3 className="m-0 mb-8">You're all caught up!</h3>
            <p className="text-secondary m-0">You don't have any notifications right now.</p>
          </div>
        )}
      </div>

    </div>
  );
}