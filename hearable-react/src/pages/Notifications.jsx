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
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annTarget, setAnnTarget] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [annMsg, setAnnMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (role === 'guest' || role === 'needs_onboarding') { navigate('/'); return; }
    if (user) fetchNotifications();
  }, [user, role, navigate]);

  async function fetchNotifications() {
    setIsLoading(true);
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setNotifications(data);
    setIsLoading(false);
  }

  async function handleMarkAsRead(id) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function handleClearAll() {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
    if (!error) setNotifications([]);
  }

  async function handleNotificationClick(notification) {
    if (!notification.is_read) await handleMarkAsRead(notification.id);
    if (notification.link) navigate(notification.link);
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
      announcement_link: null, // Hardcoded to null since the field is removed
      target_audience: annTarget
    });

    setIsSending(false);

    if (error) {
      setAnnMsg({ type: 'error', text: 'Failed to broadcast: ' + error.message });
    } else {
      alert('Announcement successfully broadcasted! 🚀');
      setAnnTitle(''); setAnnMessage(''); setAnnTarget('all');
      setShowAnnounceModal(false);
      fetchNotifications();
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>

      {/* 🚨 THE ADMIN MODAL POPUP */}
      {showAnnounceModal && role === 'admin' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="card p-0" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-color)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><span>📢</span> Send Broadcast</h2>
              <button onClick={() => setShowAnnounceModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              {annMsg.text && <div style={{ color: '#dc2626', marginBottom: '16px' }}>{annMsg.text}</div>}
              
              <form onSubmit={handleSendAnnouncement} className="flex-col gap-16">
                <div className="form-grid-2">
                  <div>
                    <label>Title *</label>
                    <input type="text" className="search-input w-full" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label>Target Audience *</label>
                    <select className="search-input w-full" value={annTarget} onChange={e => setAnnTarget(e.target.value)}>
                      <option value="all">Everyone</option>
                      <option value="applicants">Applicants Only</option>
                      <option value="companies">Companies Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label>Message *</label>
                  <textarea className="search-input w-full" value={annMessage} onChange={e => setAnnMessage(e.target.value)} style={{ height: '100px', resize: 'vertical' }} required />
                </div>
                
                <div className="mt-8 flex-row gap-12">
                  <button type="submit" className="btn-black flex-grow" disabled={isSending}>
                    {isSending ? 'Broadcasting...' : '🚀 Send Announcement'}
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setShowAnnounceModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex-between align-center mb-24">
        <h1 className="m-0">{role === 'admin' ? 'Your Notifications' : 'Notifications'}</h1>
        
        <div className="flex-row gap-12">
          {role === 'admin' && (
            <button className="btn-black btn-sm" onClick={() => setShowAnnounceModal(true)}>
              New Broadcast
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn-outline btn-sm" onClick={handleClearAll} style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <p className="text-center text-secondary p-32 m-0">Loading your notifications...</p>
        ) : notifications.length > 0 ? (
          <div className="flex-col">
            {notifications.map((notif, index) => (
              <div key={notif.id} onClick={() => handleNotificationClick(notif)} style={{ padding: '20px 24px', borderBottom: index !== notifications.length - 1 ? '1px solid var(--border-color)' : 'none', backgroundColor: notif.is_read ? 'transparent' : 'var(--bg-color)', cursor: notif.link ? 'pointer' : 'default', display: 'flex', gap: '16px' }}>
                <div style={{ flexShrink: 0, marginTop: '6px' }}>
                  <span style={{ display: 'block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: notif.is_read ? 'transparent' : 'var(--primary-color)' }}></span>
                </div>
                <div className="w-full">
                  <div className="flex-between-start mb-8">
                    <h4 className="m-0" style={{ fontWeight: notif.is_read ? '500' : '700' }}>{notif.title}</h4>
                    <span className="text-sm text-secondary block ml-16">{new Date(notif.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-secondary m-0" style={{ lineHeight: '1.5' }}>{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-32"><div className="text-3xl mb-16">📭</div><h3 className="m-0 mb-8">You're all caught up!</h3></div>
        )}
      </div>

    </div>
  );
}