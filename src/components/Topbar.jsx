import React from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import LiveOnlineTicker from './LiveOnlineTicker';

export default function Topbar({ activeTab }) {
  const { newRequestsCount, resetRequestsCount, onlineCount } = useAdminAuth();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Boshqaruv Paneli & Analitika';
      case 'moderation': return 'Vazifalar Moderatsiyasi (Jonli Navbat)';
      case 'payouts': return 'Pul Yechish So\'rovlari (Payouts)';
      case 'tasks': return 'Vazifalar Konstruktori (Task Builder)';
      case 'spin': return 'Baraban (Spin Wheel) Boshqaruvi';
      case 'users': return 'Foydalanuvchilar Boshqaruvi';
      case 'ads': return 'Reklama & Bannerlar Boshqaruvi';
      case 'settings': return 'Tizim Sozlamalari & Konfiguratsiya';
      default: return 'Admin Panel';
    }
  };

  return (
    <header className="h-16 px-6 bg-surface-container-lowest/60 border-b border-white/5 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
      <div>
        <h1 className="font-headline font-bold text-white text-base">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time online count indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <LiveOnlineTicker baseCount={onlineCount} size="sm" label="nafar onlayn" />
        </div>

        {/* Notifications Alert Bell */}
        <button
          type="button"
          onClick={resetRequestsCount}
          className="relative w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {newRequestsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary-container text-white font-mono text-[9px] font-bold flex items-center justify-center animate-bounce">
              {newRequestsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
