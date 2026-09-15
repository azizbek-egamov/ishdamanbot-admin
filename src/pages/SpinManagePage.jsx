import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import AmountInput from '../components/AmountInput';
import { formatUZS } from '../utils/formatters';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

// ─── Color presets for quick selection ──────────────────────────────────────
const COLOR_PRESETS = [
  '#ff3b53', '#05d59e', '#00b4d8', '#f59e0b',
  '#8b5cf6', '#ec4899', '#3b82f6', '#10b981',
  '#f97316', '#1e222d',
];

const ICON_PRESETS = [
  'stars', 'bolt', 'workspace_premium', 'diamond',
  'favorite', 'emoji_events', 'local_fire_department', 'rocket_launch',
  'monetization_on', 'savings', 'celebration', 'auto_awesome',
];

// ─── Helper Functions for Wheel Rendering ───────────────────────────────────
function getLuminance(hex) {
  if (!hex) return 0;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function adjustBrightness(hex, percent) {
  if (!hex) return '#ff3b53';
  let num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = (num >> 8 & 0x00FF) + amt;
  let B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 0 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

function formatRewardDisplay(reward) {
  const amount = Number(reward.amount || 0);
  if (amount > 0) {
    let formattedAmount = '';
    if (amount >= 1_000_000) {
      formattedAmount = `+${parseFloat((amount / 1_000_000).toFixed(1))}M`;
    } else if (amount >= 10_000) {
      formattedAmount = `+${parseFloat((amount / 1_000).toFixed(1))}K`;
    } else if (amount >= 1_000) {
      formattedAmount = `+${amount.toLocaleString('ru-RU')}`;
    } else {
      formattedAmount = `+${amount}`;
    }
    return {
      primary: formattedAmount,
      secondary: 'UZS',
    };
  }

  const label = (reward.label || 'Sovrin').trim();
  const words = label.split(/\s+/);
  if (words.length >= 2) {
    return {
      primary: words[0],
      secondary: words.slice(1).join(' '),
    };
  }
  return {
    primary: label,
    secondary: '',
  };
}

// ─── Live Spin Wheel Preview ─────────────────────────────────────────────────
function SpinWheelPreview({ rewards }) {
  const canvasRef = useRef(null);
  const [testRotation, setTestRotation] = useState(0);
  const [isTestSpinning, setIsTestSpinning] = useState(false);
  const activeRewards = rewards.filter(r => r.is_active !== false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeRewards.length === 0) return;
    const ctx = canvas.getContext('2d');
    const size = 280;
    const dpr = window.devicePixelRatio || 2;

    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const count = activeRewards.length;
    const arc = (2 * Math.PI) / count;

    const outerRimRadius = size / 2 - 2;
    const rimWidth = 12;
    const wheelRadius = outerRimRadius - rimWidth;
    const hubRadius = Math.max(22, Math.floor(size * 0.12));

    // 1. Outer Casino Rim
    ctx.beginPath();
    ctx.arc(cx, cy, outerRimRadius, 0, 2 * Math.PI);
    const rimGrad = ctx.createLinearGradient(0, 0, size, size);
    rimGrad.addColorStop(0, '#2e313d');
    rimGrad.addColorStop(0.5, '#181922');
    rimGrad.addColorStop(1, '#0c0d12');
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.stroke();

    // 2. Marquee LED Lights
    const bulbCount = Math.max(16, count * 3);
    for (let j = 0; j < bulbCount; j++) {
      const bulbAngle = (j * 2 * Math.PI) / bulbCount;
      const bulbDist = outerRimRadius - rimWidth / 2;
      const bx = cx + bulbDist * Math.cos(bulbAngle);
      const by = cy + bulbDist * Math.sin(bulbAngle);

      ctx.beginPath();
      ctx.arc(bx, by, 2.2, 0, 2 * Math.PI);
      const isGold = j % 2 === 0;
      ctx.fillStyle = isGold ? '#ffd700' : '#ffffff';
      ctx.shadowColor = isGold ? '#ffd700' : '#ffffff';
      ctx.shadowBlur = 4;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 3. Sectors
    activeRewards.forEach((reward, i) => {
      const startAngle = i * arc - Math.PI / 2;
      const endAngle = startAngle + arc;
      const midAngle = startAngle + arc / 2;
      const baseColor = reward.color || '#ff3b53';

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, wheelRadius, startAngle, endAngle);
      ctx.closePath();

      const sectorGrad = ctx.createRadialGradient(cx, cy, hubRadius, cx, cy, wheelRadius);
      sectorGrad.addColorStop(0, adjustBrightness(baseColor, -25));
      sectorGrad.addColorStop(0.85, baseColor);
      sectorGrad.addColorStop(1, adjustBrightness(baseColor, 15));
      ctx.fillStyle = sectorGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 4. Sector Text (Adaptive & ALWAYS Upright)
      const { primary, secondary } = formatRewardDisplay(reward);
      const lum = getLuminance(baseColor);
      const isLightBg = lum > 170;
      const primaryColor = isLightBg ? '#0d0e15' : '#ffffff';
      const secondaryColor = isLightBg ? '#2d3748' : 'rgba(255, 255, 255, 0.85)';

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);

      const textRadius = (hubRadius + wheelRadius) / 2 + 3;
      ctx.translate(textRadius, 0);

      // Auto-flip for sectors on the left half so text is never upside-down
      const cosAngle = Math.cos(midAngle);
      if (cosAngle < 0) {
        ctx.rotate(Math.PI);
      }

      const maxAvailableWidth = (wheelRadius - hubRadius) * 0.76;
      let primaryFontSize = Math.min(15, Math.max(10, Math.floor(180 / Math.max(count, 4))));
      ctx.font = `bold ${primaryFontSize}px Inter, sans-serif`;

      while (ctx.measureText(primary).width > maxAvailableWidth && primaryFontSize > 9) {
        primaryFontSize -= 1;
        ctx.font = `bold ${primaryFontSize}px Inter, sans-serif`;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = primaryColor;
      ctx.shadowColor = isLightBg ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 3;

      if (secondary) {
        const subFontSize = Math.max(8, Math.floor(primaryFontSize * 0.72));
        ctx.fillText(primary, 0, -primaryFontSize * 0.42);

        ctx.font = `600 ${subFontSize}px Inter, sans-serif`;
        ctx.fillStyle = secondaryColor;
        ctx.fillText(secondary, 0, primaryFontSize * 0.65);
      } else {
        ctx.fillText(primary, 0, 0);
      }

      ctx.restore();
    });

    // 5. Center Hub
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius + 3, 0, 2 * Math.PI);
    const goldRing = ctx.createLinearGradient(cx - hubRadius, cy - hubRadius, cx + hubRadius, cy + hubRadius);
    goldRing.addColorStop(0, '#fef08a');
    goldRing.addColorStop(0.5, '#eab308');
    goldRing.addColorStop(1, '#a16207');
    ctx.fillStyle = goldRing;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius - 1, 0, 2 * Math.PI);
    const hubGrad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, hubRadius);
    hubGrad.addColorStop(0, '#2b2e3b');
    hubGrad.addColorStop(0.7, '#14161f');
    hubGrad.addColorStop(1, '#090a0d');
    ctx.fillStyle = hubGrad;
    ctx.fill();

    ctx.font = `bold ${Math.floor(hubRadius * 0.85)}px Inter, sans-serif`;
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6;
    ctx.fillText('★', cx, cy);
    ctx.shadowBlur = 0;

    ctx.restore();
  }, [activeRewards]);

  const handleTestSpin = () => {
    if (isTestSpinning || activeRewards.length === 0) return;
    setIsTestSpinning(true);
    const randomTurns = 5 + Math.floor(Math.random() * 4);
    const randomSector = Math.floor(Math.random() * activeRewards.length);
    const sectorAngle = 360 / activeRewards.length;
    const targetDeg = testRotation + 360 * randomTurns + (360 - randomSector * sectorAngle - sectorAngle / 2);
    setTestRotation(targetDeg);
    setTimeout(() => {
      setIsTestSpinning(false);
    }, 4200);
  };

  if (activeRewards.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-on-surface-variant text-sm">
        Faol sovrin yo'q
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {/* Ambient Neon Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary-container/20 via-transparent to-secondary-container/20 blur-xl pointer-events-none" />

        {/* Rotating Wheel Disc */}
        <div
          style={{
            transform: `rotate(${testRotation}deg)`,
            transitionDuration: isTestSpinning ? '4.2s' : '0s',
            transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.2, 1)',
          }}
          className="rounded-full flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            className="rounded-full shadow-[0_0_35px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Stationary Top Pointer Needle */}
        <div className="absolute -top-1.5 z-30 pointer-events-none flex flex-col items-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
          <div className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[22px] border-t-[#ff3b53]" />
          <div className="w-2 h-2 rounded-full bg-[#ffd700] -mt-5 shadow-sm" />
        </div>
      </div>

      {/* Quick Test Spin Button for Admin */}
      <button
        type="button"
        disabled={isTestSpinning}
        onClick={handleTestSpin}
        className="px-4 py-1.5 rounded-lg bg-surface-container border border-white/10 hover:border-white/20 text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px] text-primary-container">
          {isTestSpinning ? 'sync' : 'play_arrow'}
        </span>
        <span>{isTestSpinning ? 'Aylanmoqda...' : 'Sinab ko\'rish (Spin)'}</span>
      </button>
    </div>
  );
}

// ─── Reward Form Modal ───────────────────────────────────────────────────────
function RewardModal({ reward, onClose, onSave }) {
  useBodyScrollLock(true);
  const isEdit = !!reward?.id;
  const [form, setForm] = useState({
    label: reward?.label || '',
    amount: reward?.amount || 0,
    probability: reward?.probability || 10,
    color: reward?.color || '#ff5165',
    icon: reward?.icon || 'stars',
    order: reward?.order || 0,
    is_active: reward?.is_active !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) { setError("Label kiritilishi shart"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const res = await api.put(`/spin/admin/rewards/${reward.id}/`, form);
        onSave(res.data, 'update');
      } else {
        const res = await api.post('/spin/admin/rewards/', form);
        onSave(res.data, 'create');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-hidden animate-fade-in">
      <div className="bg-surface-container-low border border-white/10 rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-modal-pop">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0 bg-surface-container-lowest/60">
          <h3 className="font-headline font-bold text-white text-base">
            {isEdit ? '✏️ Sovrinni tahrirlash' : '➕ Yangi sovrin qo\'shish'}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <form id="reward-form" onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
          {error && (
            <div className="px-3 py-2 bg-error-container/30 border border-error/40 rounded-lg text-error text-xs">{error}</div>
          )}

          {/* Label */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Nomi *</label>
            <input
              value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              placeholder="Masalan: 500 UZS, Yaxshi urinish!"
              className="px-3 py-2 rounded-lg bg-surface-container border border-white/10 text-white text-sm focus:border-primary-container/60 focus:outline-none"
            />
          </div>

          {/* Amount + Probability */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Miqdor (UZS)</label>
              <AmountInput
                value={form.amount}
                onChange={val => setForm(p => ({ ...p, amount: val }))}
                placeholder="0"
                className="px-3 py-2 rounded-lg bg-surface-container border border-white/10 text-white text-sm focus:border-primary-container/60 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Ehtimollik (%)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.probability}
                onChange={e => setForm(p => ({ ...p, probability: parseFloat(e.target.value) || 1 }))}
                className="px-3 py-2 rounded-lg bg-surface-container border border-white/10 text-white text-sm focus:border-primary-container/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Order + Active */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Tartib (Order)</label>
              <input
                type="number"
                min="0"
                value={form.order}
                onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                className="px-3 py-2 rounded-lg bg-surface-container border border-white/10 text-white text-sm focus:border-primary-container/60 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Holat</label>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${form.is_active
                  ? 'bg-secondary-container/20 border-secondary-container/50 text-secondary'
                  : 'bg-surface-container border-white/10 text-on-surface-variant'}`}
              >
                {form.is_active ? '✓ Faol' : '✗ Nofaol'}
              </button>
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Rang</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  style={{ background: c }}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-surface-container-low scale-110' : ''}`}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                title="Maxsus rang"
              />
            </div>
          </div>

          {/* Icon */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Ikonka (Material)</label>
            <div className="flex flex-wrap gap-2">
              {ICON_PRESETS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, icon: ic }))}
                  style={{ color: form.icon === ic ? form.color : undefined }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all text-on-surface-variant hover:text-white ${form.icon === ic ? 'bg-surface-container-high ring-1 ring-white/30' : 'bg-surface-container/50'}`}
                  title={ic}
                >
                  <span className="material-symbols-outlined text-[20px]">{ic}</span>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className="flex gap-3 p-4 sm:p-5 border-t border-white/5 shrink-0 bg-surface-container-lowest/80">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-white text-sm font-semibold transition-colors">
            Bekor
          </button>
          <button type="submit" form="reward-form" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-primary-container text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-neon-red">
            {saving ? 'Saqlanmoqda...' : isEdit ? 'Yangilash' : 'Qo\'shish'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main SpinManagePage ─────────────────────────────────────────────────────
export default function SpinManagePage() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalReward, setModalReward] = useState(null); // null=closed, {}=new, {id,...}=edit
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/spin/admin/rewards/');
      setRewards(res.data);
    } catch {
      showToast('Sovrinlarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRewards(); }, []);

  const handleSave = (saved, mode) => {
    if (mode === 'create') {
      setRewards(prev => [...prev, saved]);
      showToast(`"${saved.label}" qo'shildi!`);
    } else {
      setRewards(prev => prev.map(r => r.id === saved.id ? saved : r));
      showToast(`"${saved.label}" yangilandi!`);
    }
  };

  const handleDelete = async (reward) => {
    if (!window.confirm(`"${reward.label}" ni o'chirishni tasdiqlaysizmi?`)) return;
    setDeletingId(reward.id);
    try {
      await api.delete(`/spin/admin/rewards/${reward.id}/`);
      setRewards(prev => prev.filter(r => r.id !== reward.id));
      showToast(`"${reward.label}" o'chirildi`, 'success');
    } catch {
      showToast("O'chirishda xatolik", 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (reward) => {
    try {
      const res = await api.patch(`/spin/admin/rewards/${reward.id}/`, { is_active: !reward.is_active });
      setRewards(prev => prev.map(r => r.id === res.data.id ? res.data : r));
      showToast(res.data.is_active ? 'Sovrin faollashtirildi' : 'Sovrin nofaol qilindi');
    } catch {
      showToast('Xatolik', 'error');
    }
  };

  const activeCount = rewards.filter(r => r.is_active).length;
  const totalProb = rewards.filter(r => r.is_active).reduce((s, r) => s + Number(r.probability), 0);

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl border transition-all ${
          toast.type === 'error'
            ? 'bg-error-container/90 border-error/50 text-white'
            : 'bg-[#003822]/90 border-secondary-container/50 text-secondary'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline font-bold text-white text-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[26px]">casino</span>
            Baraban (Spin Wheel) Boshqaruvi
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Sovrinlarni qo'shing, tahrirlang yoki o'chiring — baraban jonli yangilanadi
          </p>
        </div>
        <button
          onClick={() => setModalReward({})}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-container rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-neon-red"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Yangi sovrin
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Jami sektorlar', value: rewards.length, icon: 'view_module', color: 'text-white' },
          { label: 'Faol sektorlar', value: activeCount, icon: 'check_circle', color: 'text-secondary' },
          { label: "Umumiy og'irlik", value: `${totalProb.toFixed(1)}%`, icon: 'percent', color: totalProb === 100 ? 'text-secondary' : 'text-orange-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <span className={`material-symbols-outlined text-[28px] ${stat.color}`}>{stat.icon}</span>
            <div>
              <div className={`font-headline font-bold text-xl ${stat.color}`}>{stat.value}</div>
              <div className="text-on-surface-variant text-xs">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout: Wheel Preview + Rewards List */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

        {/* Left: Live Wheel Preview */}
        <div className="bg-surface-container-low border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-4">
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
            📡 Jonli Ko'rinish
          </div>

          <SpinWheelPreview rewards={rewards} />

          {/* Probability Warning */}
          {Math.abs(totalProb - 100) > 0.5 && rewards.length > 0 && (
            <div className="w-full px-3 py-2 bg-orange-500/15 border border-orange-500/30 rounded-lg text-orange-400 text-xs text-center">
              ⚠️ Faol sovrinlar og'irligi: <b>{totalProb.toFixed(1)}%</b>
              <br/>Ideal: 100%. Tizim avtomatik normallashtiradi.
            </div>
          )}

          {totalProb > 0 && (
            <div className="w-full space-y-1">
              <div className="text-xs text-on-surface-variant text-center mb-2">Haqiqiy ehtimolliklar</div>
              {rewards.filter(r => r.is_active).map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                  <div className="flex-1 bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(Number(r.probability) / totalProb * 100).toFixed(1)}%`, background: r.color }}
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono w-10 text-right">
                    {(Number(r.probability) / totalProb * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Rewards Table */}
        <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              Sovrinlar ro'yxati
              <span className="ml-2 text-on-surface-variant font-normal text-xs">({rewards.length} ta)</span>
            </span>
            <button onClick={fetchRewards} className="text-on-surface-variant hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rewards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] opacity-30">casino</span>
              <p className="text-sm">Hech qanday sovrin yo'q</p>
              <button onClick={() => setModalReward({})} className="text-primary-container text-sm font-semibold hover:underline">
                Birinchi sovrinni qo'shing →
              </button>
            </div>
          ) : (
            <div className="overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] text-on-surface-variant uppercase tracking-wide">
                    <th className="text-left px-5 py-3">#</th>
                    <th className="text-left px-3 py-3">Rang</th>
                    <th className="text-left px-3 py-3">Nomi</th>
                    <th className="text-right px-3 py-3">Miqdor</th>
                    <th className="text-right px-3 py-3">Ehtimollik</th>
                    <th className="text-center px-3 py-3">Holat</th>
                    <th className="text-center px-3 py-3">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((reward, idx) => (
                    <tr
                      key={reward.id}
                      className={`border-b border-white/5 transition-colors hover:bg-surface-container/50 ${!reward.is_active ? 'opacity-45' : ''}`}
                    >
                      <td className="px-5 py-3 text-on-surface-variant font-mono text-xs">{idx + 1}</td>

                      {/* Color swatch */}
                      <td className="px-3 py-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: reward.color + '30', border: `2px solid ${reward.color}` }}
                        >
                          <span className="material-symbols-outlined text-[16px]" style={{ color: reward.color }}>
                            {reward.icon || 'stars'}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-3 py-3">
                        <span className="font-semibold text-white">{reward.label}</span>
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3 text-right">
                        {Number(reward.amount) > 0 ? (
                          <span className="text-secondary font-mono font-semibold">
                            +{formatUZS(reward.amount)}
                            <span className="text-on-surface-variant font-normal ml-1 text-[10px]">UZS</span>
                          </span>
                        ) : (
                          <span className="text-on-surface-variant text-xs">—</span>
                        )}
                      </td>

                      {/* Probability */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-mono text-xs text-on-surface-variant">
                          {Number(reward.probability).toFixed(1)}
                        </span>
                      </td>

                      {/* Active toggle */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(reward)}
                          className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                            reward.is_active
                              ? 'bg-secondary-container/20 text-secondary border border-secondary-container/40'
                              : 'bg-surface-container text-on-surface-variant border border-white/10'
                          }`}
                        >
                          {reward.is_active ? 'FAOL' : 'OFF'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setModalReward(reward)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container-high transition-colors"
                            title="Tahrirlash"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(reward)}
                            disabled={deletingId === reward.id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors disabled:opacity-50"
                            title="O'chirish"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {deletingId === reward.id ? 'hourglass_empty' : 'delete'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalReward !== null && (
        <RewardModal
          reward={modalReward?.id ? modalReward : null}
          onClose={() => setModalReward(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
