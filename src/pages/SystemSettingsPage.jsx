import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import AmountInput from '../components/AmountInput';

export default function SystemSettingsPage() {
  const { showToast } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    platform_name: 'ISHDAMAN',
    referral_reward: 500,
    min_withdrawal: 10000,
    spin_cooldown_hours: 24,
    welcome_bonus: 0,
    support_username: 'ISHDAMAN_support',
    official_channel: '@ISHDAMAN_channel',
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/settings/');
      setSettings(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.patch('/users/settings/', {
        platform_name: settings.platform_name,
        referral_reward: parseFloat(settings.referral_reward),
        min_withdrawal: parseFloat(settings.min_withdrawal),
        spin_cooldown_hours: parseInt(settings.spin_cooldown_hours, 10),
        welcome_bonus: parseFloat(settings.welcome_bonus),
        support_username: settings.support_username,
        official_channel: settings.official_channel,
      });
      setSettings(res.data);
      showToast('Tizim sozlamalari muvaffaqiyatli saqlandi va yangilandi!');
    } catch (err) {
      showToast('Sozlamalarni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col">
        <h2 className="font-headline font-bold text-white text-xl">
          Tizim Sozlamalari (Dinamik Konfiguratsiya)
        </h2>
        <span className="text-xs text-on-surface-variant">
          Referal narxi, minimal pul yechish, ruletka taymeri va rasmiy manzillarni to'liq boshqarish
        </span>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center text-on-surface-variant">
          <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col gap-6 shadow-2xl">
          {/* Section 1: Financial & Rewards */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                attach_money
              </span>
              <h3 className="font-headline font-semibold text-white text-sm">
                Moliyaviy va Mukofot Sozlamalari
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-mono">
                  Referal Mukofoti (UZS):
                </label>
                <AmountInput
                  value={settings.referral_reward}
                  onChange={(val) => setSettings({ ...settings, referral_reward: val })}
                  placeholder="500"
                  required
                  className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-sm outline-none focus:border-primary-container"
                />
                <span className="text-[10px] text-on-surface-variant">
                  Har bir taklif qilingan faol a'zo uchun beriladi. Bot va WebAppda darhol yangilanadi.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-mono">
                  Minimal Pul Yechish Summasi (UZS):
                </label>
                <AmountInput
                  value={settings.min_withdrawal}
                  onChange={(val) => setSettings({ ...settings, min_withdrawal: val })}
                  placeholder="10 000"
                  required
                  className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-sm outline-none focus:border-primary-container"
                />
                <span className="text-[10px] text-on-surface-variant">
                  Foydalanuvchi yechib olishi mumkin bo'lgan eng kam chegara.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-mono">
                  Ruletka Cooldown (Soat):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="168"
                  value={settings.spin_cooldown_hours}
                  onChange={(e) => setSettings({ ...settings, spin_cooldown_hours: parseInt(e.target.value, 10) || 1 })}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-sm outline-none focus:border-primary-container"
                />
                <span className="text-[10px] text-on-surface-variant">
                  Necha soatda 1 marta bepul omad ruletkasi aylantirish mumkin (standart: 24).
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-mono">
                  Xush Kelibsiz Bonusi (Start Bonusi UZS):
                </label>
                <AmountInput
                  value={settings.welcome_bonus}
                  onChange={(val) => setSettings({ ...settings, welcome_bonus: val })}
                  placeholder="0"
                  required
                  className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-sm outline-none focus:border-primary-container"
                />
                <span className="text-[10px] text-on-surface-variant">
                  Yangi ro'yxatdan o'tgan user balansiga darhol sovg'a sifatida tushadi (0 = o'chiq).
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Branding and Support */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                tune
              </span>
              <h3 className="font-headline font-semibold text-white text-sm">
                Platforma va Telegram Bog'lanishlari
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant">Platforma Nomi:</label>
                <input
                  type="text"
                  required
                  value={settings.platform_name}
                  onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant">Qo'llab-quvvatlash Telegram @username:</label>
                <input
                  type="text"
                  required
                  value={settings.support_username}
                  onChange={(e) => setSettings({ ...settings, support_username: e.target.value })}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-xs outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs text-on-surface-variant">Rasmiy Telegram Kanal:</label>
                <input
                  type="text"
                  required
                  value={settings.official_channel}
                  onChange={(e) => setSettings({ ...settings, official_channel: e.target.value })}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-xs outline-none focus:border-primary-container"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-primary-container text-white font-bold text-xs uppercase tracking-wider shadow-neon-red flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
