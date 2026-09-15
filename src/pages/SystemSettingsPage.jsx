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

      {/* Section 3: Admin Security & Password Change */}
      <AdminPasswordChangeSection showToast={showToast} />
    </div>
  );
}

function AdminPasswordChangeSection({ showToast }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Yangi parol kamida 6 ta belgidan iborat bo\'lishi shart', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Yangi parollar bir-biriga mos kelmadi!', 'error');
      return;
    }

    try {
      setChanging(true);
      const res = await api.post('/users/auth/change-password/', {
        current_password: currentPassword,
        new_username: newUsername.trim() || undefined,
        new_password: newPassword
      });

      if (res.data?.tokens?.access) {
        localStorage.setItem('th_admin_token', res.data.tokens.access);
      }

      showToast(res.data?.message || 'Admin login va paroli muvaffaqiyatli yangilandi! 🛡️', 'success');
      setCurrentPassword('');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Parolni yangilashda xatolik yuz berdi';
      showToast(msg, 'error');
    } finally {
      setChanging(false);
    }
  };

  return (
    <form onSubmit={handlePasswordChange} className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col gap-5 shadow-2xl">
      <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">lock_reset</span>
        </div>
        <div className="flex flex-col">
          <h3 className="font-headline font-semibold text-white text-sm">
            Administrator Xavfsizligi &amp; Parolni Yangilash
          </h3>
          <span className="text-[11px] text-on-surface-variant">
            Boshqaruv paneliga kirish login va maxfiy parolini xavfsiz o'zgartirish
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-on-surface-variant font-mono">Joriy Parol:</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Joriy parolingizni kiriting..."
            className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-xs outline-none focus:border-primary-container"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-on-surface-variant font-mono">Yangi Login (ixtiyoriy):</label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
            className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-xs outline-none focus:border-primary-container"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-on-surface-variant font-mono">Yangi Maxfiy Parol:</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Kamida 6 ta belgi..."
            className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-xs outline-none focus:border-primary-container"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-on-surface-variant font-mono">Yangi Parolni Tasdiqlang:</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Parolni qayta kiriting..."
            className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-xs outline-none focus:border-primary-container"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={changing}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">security</span>
          <span>{changing ? 'Saqlanmoqda...' : 'Admin Parolini Yangilash'}</span>
        </button>
      </div>
    </form>
  );
}
