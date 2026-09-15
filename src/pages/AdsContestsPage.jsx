import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatUZS } from '../utils/formatters';
import getImageUrl from '../utils/imageUrl';

export default function AdsContestsPage() {
  const { showToast } = useAdminAuth();
  const [ads, setAds] = useState([]);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Ad form modal
  const [showAdModal, setShowAdModal] = useState(false);
  const [newAd, setNewAd] = useState({
    partner_name: '',
    badge_text: 'Homiy',
    title: '',
    description: '',
    banner_image: '',
    target_url: '',
    position: 'trade_section',
    reward_note: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adsRes, contestRes] = await Promise.all([
        api.get('/marketplace/admin/ads/'),
        api.get('/contests/active/'),
      ]);
      setAds(adsRes.data);
      setContest(contestRes.data.contest);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/marketplace/admin/ads/', newAd);
      showToast('Yangi reklama banneri e\'lon qilindi!');
      setShowAdModal(false);
      setNewAd({
        partner_name: '',
        badge_text: 'Homiy',
        title: '',
        description: '',
        banner_image: '',
        target_url: '',
        position: 'trade_section',
        reward_note: '',
      });
      fetchData();
    } catch (e) {
      showToast('Bannerni yaratishda xato yuz berdi');
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Bannerni o\'chirmoqchimisiz?')) return;
    try {
      await api.delete(`/marketplace/admin/ads/${adId}/`);
      showToast('Banner o\'chirildi');
      fetchData();
    } catch (e) {
      showToast('Xatolik yuz berdi');
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Active Contest Section */}
      <section className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-secondary font-mono uppercase">Konkurslar & Giveaway Tizimi</span>
            <h3 className="font-headline font-bold text-white text-lg">
              Faol Haftalik Konkurs
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-secondary-container/15 text-secondary text-xs font-mono font-bold">
            Status: Faol
          </span>
        </div>

        {contest ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-white/5 flex flex-col">
              <span className="text-[11px] text-on-surface-variant">Konkurs Nomi</span>
              <span className="font-headline font-semibold text-white text-sm mt-1">{contest.title}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-white/5 flex flex-col">
              <span className="text-[11px] text-on-surface-variant">Sovrin Fondi</span>
              <span className="font-mono font-bold text-secondary text-base mt-1">
                {formatUZS(contest.prize_pool)} UZS
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-white/5 flex flex-col">
              <span className="text-[11px] text-on-surface-variant">1-o'rin Sovrini</span>
              <span className="font-mono font-bold text-amber-400 text-base mt-1">
                {formatUZS(contest.first_prize)} UZS
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-white/5 flex flex-col">
              <span className="text-[11px] text-on-surface-variant">Tugash Sanasi</span>
              <span className="font-mono text-white text-xs mt-1">
                {new Date(contest.end_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-on-surface-variant">Konkurs yuklanmoqda...</span>
        )}
      </section>

      {/* Ads Marketplace Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-headline font-bold text-white text-lg">
              Ad Marketplace // Homiy Bannerlari
            </h3>
            <span className="text-xs text-on-surface-variant">
              Foydalanuvchilarga ko'rsatiladigan broker va prop reklama kartalari
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAdModal(true)}
            className="px-4 py-2 rounded-xl bg-primary-container text-white text-xs font-bold uppercase shadow-neon-red flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Yangi Banner Qo'shish</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-on-surface-variant">
            <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : ads.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-xs text-on-surface-variant">
            Hozircha bannerlar joylashtirilmagan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="relative h-36 w-full">
                    <img
                      src={getImageUrl(ad.banner_image)}
                      alt={ad.partner_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';
                      }}
                    />
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-primary-container text-white font-mono text-[10px] font-bold">
                      {ad.position}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-1.5">
                    <span className="text-[11px] font-mono text-tertiary">{ad.partner_name}</span>
                    <h4 className="font-headline font-bold text-white text-sm">{ad.title}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{ad.description}</p>
                    <span className="text-[10px] text-secondary font-mono mt-1">
                      Ko'rishlar: {ad.clicks_count} marta
                    </span>
                  </div>
                </div>

                <div className="p-4 pt-0 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteAd(ad.id)}
                    className="text-xs text-error hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>O'chirish</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-container rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-headline font-bold text-white text-base">
                Yangi Banner Joylashtirish
              </h3>
              <button
                type="button"
                onClick={() => setShowAdModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAd} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant">Homiy / Broker Nomi:</label>
                  <input
                    type="text"
                    required
                    value={newAd.partner_name}
                    onChange={(e) => setNewAd({ ...newAd, partner_name: e.target.value })}
                    placeholder="Masalan: Exness Pro"
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant">Nishon (Badge):</label>
                  <input
                    type="text"
                    value={newAd.badge_text}
                    onChange={(e) => setNewAd({ ...newAd, badge_text: e.target.value })}
                    placeholder="Masalan: Rasmiy Hamkor"
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">Sarlavha:</label>
                <input
                  type="text"
                  required
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  placeholder="Banner sarlavhasi..."
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">Ta'rif:</label>
                <textarea
                  rows="2"
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  placeholder="Taklif haqida batafsil..."
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">Banner Rasm URL:</label>
                <input
                  type="url"
                  required
                  value={newAd.banner_image}
                  onChange={(e) => setNewAd({ ...newAd, banner_image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">Target Ssilka (URL):</label>
                <input
                  type="url"
                  required
                  value={newAd.target_url}
                  onChange={(e) => setNewAd({ ...newAd, target_url: e.target.value })}
                  placeholder="https://exness.com/..."
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary-container text-white font-bold text-xs uppercase tracking-wider shadow-neon-red"
                >
                  Bannerni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
