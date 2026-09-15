import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await login(username, password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Kirishda xatolik yuz berdi. Login yoki parol noto\'g\'ri.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Cyber Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col gap-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-container to-[#be0034] p-1 flex items-center justify-center text-white shadow-neon-red mb-1">
            <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
          </div>
          <h1 className="font-headline font-bold text-white text-2xl tracking-tight uppercase">
            ISHDAMAN Admin
          </h1>
          <span className="font-mono text-xs text-primary-fixed-dim">
            Cyberpunk Boshqaruv Tizimi
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-on-surface-variant">Admin Login:</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="px-4 py-3 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-sm font-mono outline-none focus:border-primary-container transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-on-surface-variant">Parol:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-4 py-3 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-sm font-mono outline-none focus:border-primary-container transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary-container text-white font-headline font-bold text-sm uppercase tracking-wider shadow-neon-red mt-2 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Boshqaruvga Kirish</span>
            )}
          </button>
        </form>

        <div className="text-center">
          <span className="text-[11px] text-on-surface-variant font-mono">
            Standart login: <b>admin</b> | Parol: <b>admin123</b>
          </span>
        </div>
      </div>
    </div>
  );
}
