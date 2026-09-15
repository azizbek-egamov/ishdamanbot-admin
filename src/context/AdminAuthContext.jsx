import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const wsRef = useRef(null);

  const fetchOnlineStats = async () => {
    try {
      const res = await api.get('/real-time/online-stats/');
      if (res.data && res.data.online_count !== undefined) {
        setOnlineCount(Number(res.data.online_count) || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchOnlineStats();
    // Safety sync fallback every 8s
    const pollInterval = setInterval(fetchOnlineStats, 8000);

    const savedToken = localStorage.getItem('th_admin_token');
    if (savedToken) {
      // Check auth validity by loading profile
      api.get('/users/profile/')
        .then((res) => {
          if (res.data.is_admin) {
            setAdmin(res.data);
            connectAdminWebSocket();
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const connectAdminWebSocket = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
    }

    let wsUrl;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${proto}//${window.location.host}/ws/admin/`;
    } else if (import.meta.env.VITE_WS_URL) {
      const base = import.meta.env.VITE_WS_URL.replace(/\/+$/, '');
      wsUrl = `${base}/ws/admin/`;
    } else if (import.meta.env.VITE_BACKEND_URL) {
      const base = import.meta.env.VITE_BACKEND_URL.replace(/^http/, 'ws').replace(/\/+$/, '');
      wsUrl = `${base}/ws/admin/`;
    } else {
      wsUrl = `wss://core.ishdaman.uz/ws/admin/`;
    }

    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log('🛡️ Admin WebSocket Monitor connected to:', wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🛡️ Admin WS event:', data);

        if (data.event === 'ONLINE_STATS_UPDATE' || data.online_count !== undefined) {
          if (data.online_count !== undefined) {
            setOnlineCount(Math.max(0, Number(data.online_count) || 0));
          }
        }

        if (data.event === 'ADMIN_NEW_REQUEST') {
          setNewRequestsCount((prev) => prev + 1);
          showToast(`Yangi so'rov: ${data.title} (${data.request_type})`);
          playBeep();
        }
      } catch (e) {
        console.error(e);
      }
    };

    ws.onclose = () => {
      console.log('🛡️ Admin WS disconnected. Reconnecting in 4s...');
      setTimeout(() => {
        if (localStorage.getItem('th_admin_token')) {
          connectAdminWebSocket();
        }
      }, 4000);
    };

    wsRef.current = ws;
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const login = async (username, password) => {
    const res = await api.post('/users/auth/admin-login/', { username, password });
    const { admin, tokens } = res.data;
    localStorage.setItem('th_admin_token', tokens.access);
    setAdmin(admin);
    connectAdminWebSocket();
    return admin;
  };

  const logout = () => {
    localStorage.removeItem('th_admin_token');
    setAdmin(null);
    if (wsRef.current) wsRef.current.close();
  };

  return (
    <AdminAuthContext.Provider value={{
      admin,
      loading,
      login,
      logout,
      onlineCount,
      newRequestsCount,
      resetRequestsCount: () => setNewRequestsCount(0),
      showToast
    }}>
      {children}

      {/* Admin Real-time Banner Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-high border border-primary-container text-white shadow-neon-red backdrop-blur-xl animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping"></span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
