import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatUZS } from '../utils/formatters';
import LiveOnlineTicker from '../components/LiveOnlineTicker';

export default function DashboardPage({ onNavigate }) {
  const { onlineCount } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/admin/dashboard-stats/');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-on-surface-variant">
        <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
      {/* Real-time WebSocket Presence Hero Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-surface-container to-surface-container-high border border-emerald-500/30 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            <span className="material-symbols-outlined text-2xl animate-pulse">sensors</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              WebSocket Jonli Monitor
            </span>
            <span className="text-sm text-white font-medium">
              Saytda ayni paytda <strong className="text-emerald-400 font-mono text-base">{onlineCount} nafar</strong> faol foydalanuvchi bor
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/40 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>100% Real-Time</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Real-time Online Users Card */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-2 border border-emerald-500/30 bg-emerald-500/5 shadow-lg relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-mono uppercase font-semibold">
              Jonli Onlayn
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.3)]">
              <span className="material-symbols-outlined text-[18px]">wifi_tethering</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LiveOnlineTicker baseCount={onlineCount} size="lg" label="kishi" />
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Ayni soniyada faol</span>
          </span>
        </div>

        {/* Total Users */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-2 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-mono uppercase">
              Jami A'zolar
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary-container/15 text-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
          </div>
          <span className="font-headline text-3xl font-bold text-white tracking-tight">
            {stats?.total_users?.toLocaleString() || 0}
          </span>
          <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>Bugun +{stats?.today_new_users || 0} yangi</span>
          </span>
        </div>

        {/* Pending Verifications */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-2 border border-primary-container/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-mono uppercase">
              Kutilayotgan Tekshiruvlar
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center shadow-neon-red">
              <span className="material-symbols-outlined text-[18px]">fact_check</span>
            </div>
          </div>
          <span className="font-headline text-3xl font-bold text-white tracking-tight">
            {stats?.pending_verifications || 0}
          </span>
          <button
            type="button"
            onClick={() => onNavigate('moderation')}
            className="text-[11px] text-primary hover:underline font-semibold text-left mt-1 flex items-center gap-1"
          >
            <span>Moderatsiya navbatiga o'tish</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Pending Payouts */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-2 border border-secondary-container/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-mono uppercase">
              Pul Yechish So'rovlari
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-container/20 text-secondary-container flex items-center justify-center shadow-neon-green">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <span className="font-headline text-3xl font-bold text-white tracking-tight">
            {stats?.pending_payouts || 0} ta
          </span>
          <button
            type="button"
            onClick={() => onNavigate('payouts')}
            className="text-[11px] text-secondary hover:underline font-semibold text-left mt-1 flex items-center gap-1"
          >
            <span>Arizalarni ko'rish</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Total Paid Amount */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-2 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-mono uppercase">
              Jami To'langan Mablag'
            </span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-container/20 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
            </div>
          </div>
          <span className="font-mono text-2xl font-bold text-white tracking-tight">
            {formatUZS(stats?.total_paid_amount)}{' '}
            <span className="text-xs text-on-surface-variant font-sans">UZS</span>
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Bugun to'landi: {formatUZS(stats?.today_paid_amount)} UZS
          </span>
        </div>
      </div>

      {/* Dynamic 7-Day Chart & Analytics */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-headline font-bold text-white text-base">
              Haftalik Faollik va To'lovlar Dinamikasi
            </h2>
            <span className="text-xs text-on-surface-variant">
              So'nggi 7 kunlik aylanma ko'rsatkichlari
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary-container"></span>
              <span className="text-on-surface-variant">Yangi userlar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-secondary-container"></span>
              <span className="text-on-surface-variant">To'langan (UZS)</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-56 flex items-end justify-between gap-4 pt-4 border-t border-white/5">
          {stats?.chart_data?.map((day, idx) => {
            const maxVal = Math.max(...(stats.chart_data.map(d => d.users + 1)), 10);
            const heightPercent = Math.min(100, Math.max(15, (day.users / maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-mono text-primary font-bold">
                  {day.users} ta
                </span>
                <div
                  className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-primary-container/40 to-primary-container transition-all hover:brightness-125"
                  style={{ height: `${heightPercent}%` }}
                ></div>
                <span className="font-mono text-xs text-on-surface-variant mt-1">
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('tasks')}
          className="glass-card rounded-xl p-4 flex items-center gap-3 border border-white/5 hover:border-primary-container transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary-container flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined">add_task</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-semibold text-white text-sm">Yangi Vazifa Yaratish</span>
            <span className="text-[11px] text-on-surface-variant">Konstruktorga o'tish</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('moderation')}
          className="glass-card rounded-xl p-4 flex items-center gap-3 border border-white/5 hover:border-secondary-container transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary-container flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined">fact_check</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-semibold text-white text-sm">Skrinshotlar Moderatsiyasi</span>
            <span className="text-[11px] text-on-surface-variant">Jonli navbatni ko'rish</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('payouts')}
          className="glass-card rounded-xl p-4 flex items-center gap-3 border border-white/5 hover:border-tertiary transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 text-tertiary flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-semibold text-white text-sm">Pul Yechishni Tasdiqlash</span>
            <span className="text-[11px] text-on-surface-variant">Karta o'tkazmalari</span>
          </div>
        </button>
      </div>
    </div>
  );
}
