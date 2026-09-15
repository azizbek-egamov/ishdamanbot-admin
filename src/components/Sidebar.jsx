import React from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Sidebar({ activeTab, onChangeTab }) {
  const { admin, logout, newRequestsCount } = useAdminAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Boshqaruv Paneli', icon: 'dashboard' },
    { id: 'moderation', label: 'Moderatsiya (Jonli)', icon: 'fact_check', badge: newRequestsCount },
    { id: 'payouts', label: 'Pul Yechish (Payouts)', icon: 'payments' },
    { id: 'shop', label: "Do'kon & Buyurtmalar", icon: 'storefront' },
    { id: 'tasks', label: 'Vazifalar Builder', icon: 'playlist_add_check' },
    { id: 'spin', label: 'Baraban (Spin)', icon: 'casino' },
    { id: 'contests', label: 'Konkurslar (Contests)', icon: 'military_tech' },
    { id: 'ads', label: 'Reklama & Bannerlar', icon: 'campaign' },
    { id: 'users', label: 'Foydalanuvchilar', icon: 'group' },
    { id: 'settings', label: 'Tizim Sozlamalari', icon: 'settings' },
  ];

  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-white/5 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-[#be0034] flex items-center justify-center text-white shadow-neon-red">
            <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-white tracking-tight uppercase text-sm">
              ISHDAMAN Admin
            </span>
            <span className="font-mono text-[10px] text-primary-fixed-dim">
              v2.4 Kiber-Boshqaruv
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                    ? 'bg-primary-container text-white shadow-neon-red'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white text-primary-container font-mono text-[10px] font-bold shadow-sm">
                    +{item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin User Footer */}
      <div className="p-3 border-t border-white/5 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center text-primary-container font-bold text-xs">
            A
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">
              {admin?.full_name || 'Administrator'}
            </span>
            <span className="text-[10px] text-secondary font-mono">
              Onlayn // Superadmin
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full py-2 rounded-lg bg-surface-container hover:bg-error-container/40 text-on-surface-variant hover:text-error text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Tizimdan chiqish</span>
        </button>
      </div>
    </aside>
  );
}
