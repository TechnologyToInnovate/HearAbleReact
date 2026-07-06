import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function useAutoLogout(timeoutMs = 900000) { // Default: 900,000 ms = 15 minutes
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  useEffect(() => {
    // If no user is logged in, do not run the timer
    if (!user) return;

    const handleLogout = async () => {
      await signOut();
      navigate('/login');
      alert("For your security, you have been logged out due to inactivity.");
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Start a new countdown
      timeoutRef.current = setTimeout(handleLogout, timeoutMs);
    };

    // The user actions that count as "activity"
    // (We omit 'mousemove' because it fires too rapidly and can slow down the app)
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    // Attach the listeners to the window
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    // Start the timer for the very first time
    resetTimer();

    // Cleanup function when the component unmounts or user logs out
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, signOut, navigate, timeoutMs]);
}