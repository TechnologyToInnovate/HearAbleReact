import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Close dropdown if clicking outside of it
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10); // Grab the 10 most recent

    if (data) setNotifications(data);
  }

  async function markAsRead(notification) {
    if (!notification.is_read) {
      // Update local state instantly for snappy UI
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      
      // Update database in the background
      await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    }

    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* The Bell Icon */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ cursor: 'pointer', position: 'relative', padding: '8px', fontSize: '1.25rem' }}
      >
        🔔
        {unreadCount > 0 && (
          <span 
            className="badge badge-primary" 
            style={{ position: 'absolute', top: 0, right: 0, padding: '2px 6px', fontSize: '0.7rem', borderRadius: '50%' }}
          >
            {unreadCount}
          </span>
        )}
      </div>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="card p-0" style={{ position: 'absolute', top: 'calc(100% + 12px)', right: '-60px', width: '320px', zIndex: 1000, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
          
          <div className="flex-between align-center" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
            <h3 className="m-0 text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => markAsRead(notif)}
                  style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid var(--border-color)', 
                    cursor: notif.link ? 'pointer' : 'default',
                    background: notif.is_read ? 'transparent' : 'var(--primary-light)',
                    transition: 'background 0.2s'
                  }}
                >
                  <strong className="block mb-4" style={{ color: notif.is_read ? 'var(--text-color)' : 'var(--primary-color)' }}>
                    {notif.title}
                  </strong>
                  <p className="m-0 text-sm" style={{ color: notif.is_read ? 'var(--secondary-text)' : 'var(--text-color)' }}>
                    {notif.message}
                  </p>
                  <span className="text-sm text-secondary block mt-8" style={{ fontSize: '0.75rem' }}>
                    {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-32 text-center text-secondary">
                <p className="m-0 text-3xl mb-8">📭</p>
                <p className="m-0">You're all caught up!</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}