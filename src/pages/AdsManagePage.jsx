import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdsManagePage() {
  const { showToast } = useAdminAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialFormState = {
    partner_name: '',
    badge_text: 'Homiy',
    title: '',
    description: '',
    banner_image: '',
    target_url: '',
    position: 'trade_section',
    reward_note: '',
    order: 0,
    is_active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await api.get('/marketplace/admin/ads/');
      setAds(res.data);
    } catch (e) {
      console.error(e);
      showToast('Bannerlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleOpenCreate = () => {
    setEditingAd(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      partner_name: ad.partner_name || '',
      badge_text: ad.badge_text || 'Homiy',
      title: ad.title || '',
      description: ad.description || '',
      banner_image: ad.banner_image || '',
      target_url: ad.target_url || '',
      position: ad.position || 'trade_section',
      reward_note: ad.reward_note || '',
      order: ad.order || 0,
      is_active: ad.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleSaveAd = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingAd) {
        await api.patch(`/marketplace/admin/ads/${editingAd.id}/`, formData);
        showToast('Banner muvaffaqiyatli tahrirlandi!');
      } else {
        await api.post('/marketplace/admin/ads/', formData);
        showToast('Yangi reklama banneri e\'lon qilindi!');
      }
      setShowModal(false);
      setEditingAd(null);
      setFormData(initialFormState);
      fetchAds();
    } catch (err) {
      const msg = err.response?.data?.error || 'Bannerni saqlashda xato yuz berdi';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      const res = await api.post(`/marketplace/admin/ads/${ad.id}/toggle/`);
      showToast(res.data.message || 'Holat o\'zgartirildi');
      fetchAds();
    } catch (e) {
      showToast('Holatni o\'zgartirishda xato yuz berdi');
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm("Bannerni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/marketplace/admin/ads/${adId}/`);
      showToast('Banner o\'chirildi');
      fetchAds();
    } catch (e) {
      showToast('Xatolik yuz berdi');
    }
  };

  const positions = [
    { id: 'all', label: 'Barcha Joylashuvlar' },
    { id: 'trade_section', label: 'Trade Sahifasi' },
    { id: 'header', label: 'Yuqori Header' },
    { id: 'tasks_between', label: 'Vazifalar Orasi' },
  ];

  const filteredAds = ads.filter((ad) => {
    if (positionFilter === 'all') return true;
    return ad.position === positionFilter;
  });

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-2xl">campaign</span>
            <h2 className="font-headline font-bold text-white text-xl uppercase tracking-tight">
              Bannerlar va Reklama (Ads & Marketplace)
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant mt-0.5">
            Mini App ichidagi homiylar bannerlarini joylashtirish, tahrirlash, kliklar statistikasini kuzatish
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAds}
            className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/10 text-white flex items-center justify-center transition-all"
            title="Yangilash"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-primary-container text-white font-bold text-xs uppercase shadow-neon-red flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Yangi Banner Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Position Filter Pills */}
      <div className="flex items-center gap-2 bg-surface-container-lowest p-1.5 rounded-2xl border border-white/5 overflow-x-auto scrollbar-none">
        {positions.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPositionFilter(p.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              positionFilter === p.id
                ? 'bg-primary-container text-white shadow-neon-red'
                : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Ads List */}
      {loading ? (
        <div className="py-16 flex justify-center text-on-surface-variant">
          <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-on-surface-variant flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">ad_units</span>
          <span>Ushbu bo'limda bannerlar topilmadi. Yuqoridagi tugma orqali yangi banner joylang.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className={`glass-card admin-card-hover rounded-2xl overflow-hidden border flex flex-col justify-between transition-all ${
                ad.is_active ? 'border-white/10 shadow-lg' : 'border-white/5 opacity-65 hover:opacity-100'
              }`}
            >
              {/* Banner Image Preview */}
              <div className="relative h-36 bg-surface-container-lowest overflow-hidden border-b border-white/5">
                {ad.banner_image ? (
                  <img
                    src={ad.banner_image}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs">
                    Rasm belgilanmagan
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-secondary font-mono text-[10px] font-bold border border-secondary/30">
                    {ad.badge_text || 'Homiy'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white font-mono text-[10px]">
                    {ad.position}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-amber-400 font-mono text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">touch_app</span>
                    <span>{ad.clicks_count} klik</span>
                  </span>
                </div>
              </div>

              {/* Content Details */}
              <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-on-surface-variant font-mono uppercase truncate max-w-[180px]">
                      {ad.partner_name}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      Tartib: #{ad.order}
                    </span>
                  </div>

                  <h4 className="font-headline font-bold text-white text-sm leading-tight">
                    {ad.title}
                  </h4>

                  {ad.description && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                      {ad.description}
                    </p>
                  )}

                  {ad.reward_note && (
                    <span className="text-[10px] text-secondary font-mono">
                      Bonus: {ad.reward_note}
                    </span>
                  )}
                </div>

                {/* Target URL */}
                <a
                  href={ad.target_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline truncate flex items-center gap-1 font-mono pt-1"
                >
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  <span>{ad.target_url}</span>
                </a>
              </div>

              {/* Actions */}
              <div className="p-3 border-t border-white/5 bg-surface-container-lowest/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleActive(ad)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                    ad.is_active
                      ? 'bg-secondary-container/15 text-secondary border-secondary/30'
                      : 'bg-surface-container text-on-surface-variant border-white/10'
                  }`}
                  title={ad.is_active ? "To'xtatish" : "Faollashtirish"}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {ad.is_active ? 'toggle_on' : 'toggle_off'}
                  </span>
                  <span>{ad.is_active ? 'Faol' : 'Nofaol'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(ad)}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px] text-primary">edit</span>
                    <span>Tahrirlash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAd(ad.id)}
                    className="px-2 py-1 rounded-lg text-error hover:bg-error/10 text-xs font-semibold flex items-center gap-0.5 transition-all"
                    title="O'chirish"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create or Edit Ad */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-white/10 w-full max-w-lg flex flex-col gap-4 shadow-2xl my-8 animate-modal-pop">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-xl">
                  {editingAd ? 'edit' : 'campaign'}
                </span>
                <h3 className="font-headline font-bold text-white text-base uppercase">
                  {editingAd ? "Bannerni Tahrirlash" : "Yangi Reklama Banneri Qo'shish"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingAd(null);
                }}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Hamkor Nomi:</label>
                  <input
                    type="text"
                    required
                    value={formData.partner_name}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                    placeholder="Masalan: Exness Broker"
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Badge Matni:</label>
                  <input
                    type="text"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="Homiy, Tavsiya, Top"
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Banner Sarlavhasi:</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masalan: Depozitsiz $50 Bonus Oling!"
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Qisqacha Tavsif:</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bannerdagi asosiy taklif va shartlar..."
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Banner Rasm Havolasi (URL):</label>
                <input
                  type="url"
                  required
                  value={formData.banner_image}
                  onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                  placeholder="https://.../banner.png"
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                />
              </div>

              {formData.banner_image && (
                <div className="h-24 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                  <img
                    src={formData.banner_image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">O'tish Havolasi (Target URL):</label>
                <input
                  type="url"
                  required
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  placeholder="https://..."
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Joylashuv:</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                  >
                    <option value="trade_section">Trade Sahifasi</option>
                    <option value="header">Yuqori Header</option>
                    <option value="tasks_between">Vazifalar Orasi</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Tartib Raqami:</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Bonus / Eslatma (Ixtiyoriy):</label>
                <input
                  type="text"
                  value={formData.reward_note}
                  onChange={(e) => setFormData({ ...formData, reward_note: e.target.value })}
                  placeholder="Masalan: Ro'yxatdan o'tganlarga bepul signal"
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-white/5">
                <input
                  type="checkbox"
                  id="ad_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
                <label htmlFor="ad_is_active" className="text-xs text-white cursor-pointer select-none">
                  Ushbu bannerni darhol faollashtirish (Ilovada ko'rinadi)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAd(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-semibold transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-amber-300 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-base">check</span>
                  )}
                  <span>{editingAd ? "Saqlash" : "Yaratish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
