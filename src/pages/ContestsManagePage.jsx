import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import AmountInput from '../components/AmountInput';
import Pagination from '../components/Pagination';
import AdminRandomizerModal from '../components/AdminRandomizerModal';
import { formatUZS } from '../utils/formatters';
import getImageUrl from '../utils/imageUrl';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function ContestsManagePage() {
  const { showToast } = useAdminAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContest, setEditingContest] = useState(null);
  const [randomizerContest, setRandomizerContest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'leaderboard'

  // Lock background scroll when modal is active
  useBodyScrollLock(showCreateModal || !!editingContest || !!randomizerContest);

  // Form Data for Create / Edit
  const defaultPrizesConfig = [
    { rank: 1, title: "1-O'rin (Bosh Sovrin)", type: 'cash', item_name: '', item_icon: 'military_tech', estimated_value: 2500000, is_cash: true, cash_amount: 2500000 },
    { rank: 2, title: "2-O'rin", type: 'cash', item_name: '', item_icon: 'workspace_premium', estimated_value: 1500000, is_cash: true, cash_amount: 1500000 },
    { rank: 3, title: "3-O'rin", type: 'cash', item_name: '', item_icon: 'emoji_events', estimated_value: 1000000, is_cash: true, cash_amount: 1000000 },
  ];

  const [formData, setFormData] = useState({
    title: 'Katta Sovrinli Konkurs',
    description: "Barcha shartlarni bajargan ishtirokchilar orasidan jonli Randomizer orqali g'oliblar aniqlanadi!",
    rules: "1. Rasmiy kanalimizga a'zo bo'lish (@ishdaman_channel)\n2. Kamida 3 ta do'stingizni taklif qilish\n3. Konkursda ishtirok etish tugmasini bosish",
    channel_link: '@ishdaman_channel',
    cta_button_text: 'Shartlarni bajardim — Ishtirok etish',
    prize_pool: 5000000,
    first_prize: 2500000,
    second_prize: 1500000,
    third_prize: 1000000,
    fourth_prize: 0,
    prizes_config: defaultPrizesConfig,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    is_active: true,
  });

  // Selected contest for Participants tab
  const [selectedContestId, setSelectedContestId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantPage, setParticipantPage] = useState(1);
  const [participantTotalPages, setParticipantTotalPages] = useState(1);
  const [participantTotalCount, setParticipantTotalCount] = useState(0);
  const [participantSearch, setParticipantSearch] = useState('');

  const fetchContests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contests/admin/contests/');
      setContests(res.data);
      if (!selectedContestId && res.data.length > 0) {
        const active = res.data.find(c => c.is_active);
        setSelectedContestId(active ? active.id : res.data[0].id);
      }
    } catch (e) {
      console.error(e);
      showToast('Musobaqalarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipantsList = async (targetContestId, targetPage = 1, searchQuery = '') => {
    if (!targetContestId) return;
    try {
      setLoadingParticipants(true);
      const query = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
      const res = await api.get(`/contests/admin/contests/${targetContestId}/participants/?page=${targetPage}${query}`);
      if (res.data && res.data.results) {
        setParticipants(res.data.results);
        setParticipantTotalPages(res.data.total_pages || 1);
        setParticipantTotalCount(res.data.count || 0);
        setParticipantPage(res.data.current_page || targetPage);
      } else if (Array.isArray(res.data)) {
        setParticipants(res.data);
        setParticipantTotalPages(1);
        setParticipantTotalCount(res.data.length);
        setParticipantPage(1);
      }
    } catch (e) {
      console.error(e);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard' && selectedContestId) {
      fetchParticipantsList(selectedContestId, 1, participantSearch);
    }
  }, [activeTab, selectedContestId]);

  const handleOpenCreate = () => {
    setFormData({
      title: 'Katta Sovrinli Konkurs',
      description: "Barcha shartlarni bajargan ishtirokchilar orasidan jonli Randomizer orqali g'oliblar aniqlanadi!",
      rules: "1. Rasmiy kanalimizga a'zo bo'lish (@ishdaman_channel)\n2. Kamida 3 ta do'stingizni taklif qilish\n3. Konkursda ishtirok etish tugmasini bosish",
      channel_link: '@ishdaman_channel',
      cta_button_text: 'Shartlarni bajardim — Ishtirok etish',
      prize_pool: 5000000,
      first_prize: 2500000,
      second_prize: 1500000,
      third_prize: 1000000,
      fourth_prize: 0,
      prizes_config: [
        { rank: 1, title: "1-O'rin (Bosh Sovrin)", type: 'cash', item_name: '', item_icon: 'military_tech', estimated_value: 2500000, is_cash: true, cash_amount: 2500000 },
        { rank: 2, title: "2-O'rin", type: 'cash', item_name: '', item_icon: 'workspace_premium', estimated_value: 1500000, is_cash: true, cash_amount: 1500000 },
        { rank: 3, title: "3-O'rin", type: 'cash', item_name: '', item_icon: 'emoji_events', estimated_value: 1000000, is_cash: true, cash_amount: 1000000 },
      ],
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      is_active: true,
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingContest(c);
    
    // Parse or build prizes_config from existing contest
    let initialPrizes = [];
    if (c.prizes_config && Array.isArray(c.prizes_config) && c.prizes_config.length > 0) {
      initialPrizes = c.prizes_config.map((p, idx) => ({
        rank: p.rank || idx + 1,
        title: p.title || `${idx + 1}-O'rin`,
        type: p.type || (p.is_cash === false ? 'item' : 'cash'),
        item_name: p.item_name || '',
        item_icon: p.item_icon || 'emoji_events',
        estimated_value: Number(p.estimated_value || p.cash_amount || 0),
        is_cash: p.is_cash !== false,
        cash_amount: Number(p.cash_amount || p.estimated_value || 0)
      }));
    } else {
      initialPrizes = [
        { rank: 1, title: "1-O'rin (Bosh Sovrin)", type: 'cash', item_name: '', item_icon: 'military_tech', estimated_value: Number(c.first_prize || 0), is_cash: true, cash_amount: Number(c.first_prize || 0) },
        { rank: 2, title: "2-O'rin", type: 'cash', item_name: '', item_icon: 'workspace_premium', estimated_value: Number(c.second_prize || 0), is_cash: true, cash_amount: Number(c.second_prize || 0) },
        { rank: 3, title: "3-O'rin", type: 'cash', item_name: '', item_icon: 'emoji_events', estimated_value: Number(c.third_prize || 0), is_cash: true, cash_amount: Number(c.third_prize || 0) },
      ];
      if (Number(c.fourth_prize) > 0) {
        initialPrizes.push({
          rank: 4,
          title: "4-O'rin",
          type: 'cash',
          item_name: '',
          item_icon: 'stars',
          estimated_value: Number(c.fourth_prize),
          is_cash: true,
          cash_amount: Number(c.fourth_prize)
        });
      }
    }

    setFormData({
      title: c.title,
      description: c.description || '',
      rules: c.rules || '',
      channel_link: c.channel_link || '',
      cta_button_text: c.cta_button_text || 'Shartlarni bajardim — Ishtirok etish',
      prize_pool: c.prize_pool,
      first_prize: c.first_prize,
      second_prize: c.second_prize,
      third_prize: c.third_prize,
      fourth_prize: c.fourth_prize || 0,
      prizes_config: initialPrizes,
      start_date: c.start_date ? new Date(c.start_date).toISOString().slice(0, 16) : '',
      end_date: c.end_date ? new Date(c.end_date).toISOString().slice(0, 16) : '',
      is_active: c.is_active,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Auto-compute legacy fields and total pool for backward compatibility
      const config = formData.prizes_config || [];
      let calculatedTotal = 0;
      let firstVal = 0;
      let secondVal = 0;
      let thirdVal = 0;
      let fourthVal = 0;

      config.forEach((p) => {
        const val = p.is_cash ? Number(p.cash_amount || 0) : Number(p.estimated_value || 0);
        calculatedTotal += val;
        if (p.rank === 1) firstVal = val;
        else if (p.rank === 2) secondVal = val;
        else if (p.rank === 3) thirdVal = val;
        else if (p.rank === 4) fourthVal = val;
      });

      const payload = {
        ...formData,
        prize_pool: calculatedTotal > 0 ? calculatedTotal : formData.prize_pool,
        first_prize: firstVal || formData.first_prize,
        second_prize: secondVal || formData.second_prize,
        third_prize: thirdVal || formData.third_prize,
        fourth_prize: fourthVal || formData.fourth_prize,
      };

      if (editingContest) {
        await api.patch(`/contests/admin/contests/${editingContest.id}/`, payload);
        showToast('Konkurs muvaffaqiyatli tahrirlandi!');
        setEditingContest(null);
      } else {
        const res = await api.post('/contests/admin/contests/', payload);
        showToast('Yangi konkurs yaratildi!');
        setShowCreateModal(false);
        if (res.data?.id) setSelectedContestId(res.data.id);
      }
      fetchContests();
    } catch (err) {
      const msg = err.response?.data?.error || 'Xatolik yuz berdi';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (contest) => {
    try {
      const res = await api.post(`/contests/admin/contests/${contest.id}/toggle/`);
      showToast(res.data.message || 'Holat o\'zgartirildi');
      fetchContests();
    } catch (e) {
      showToast('Holatni o\'zgartirishda xato yuz berdi');
    }
  };

  const handleDelete = async (contestId) => {
    if (!window.confirm("Haqiqatan ham bu musobaqani o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/contests/admin/contests/${contestId}/`);
      showToast("Musobaqa o'chirildi");
      fetchContests();
    } catch (e) {
      showToast("O'chirishda xatolik yuz berdi");
    }
  };

  const handleAdjustPoints = async (participant) => {
    const raw = window.prompt(`${participant.full_name} uchun yangi ball miqdorini kiriting:`, participant.points);
    if (raw === null) return;
    const num = parseInt(raw, 10);
    if (isNaN(num) || num < 0) {
      showToast('Noto\'g\'ri ball kiritildi');
      return;
    }
    try {
      await api.patch(`/contests/admin/contests/${selectedContestId}/participants/`, {
        participant_id: participant.id,
        points: num
      });
      showToast('Ball muvaffaqiyatli yangilandi');
      fetchParticipantsList(selectedContestId, participantPage, participantSearch);
    } catch {
      showToast('Ballni yangilashda xatolik yuz berdi');
    }
  };

  const handleDeleteParticipant = async (participant) => {
    if (!window.confirm(`${participant.full_name} ni musobaqadan o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.delete(`/contests/admin/contests/${selectedContestId}/participants/`, {
        data: { participant_id: participant.id }
      });
      showToast("Ishtirokchi o'chirildi");
      fetchParticipantsList(selectedContestId, participantPage, participantSearch);
    } catch {
      showToast("O'chirishda xatolik yuz berdi");
    }
  };

  const handleViewParticipants = (contestId) => {
    setSelectedContestId(contestId);
    setActiveTab('leaderboard');
  };

  const activeContest = contests.find((c) => c.is_active);

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">casino</span>
            <h2 className="font-headline font-bold text-white text-xl uppercase tracking-tight">
              Konkurslar & Giveaway Boshqaruvi
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant mt-0.5">
            Sovrinli konkurslarni yaratish, shartlarni to'liq belgilash va jonli Randomizer orqali g'oliblarni adolatli aniqlash
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchContests}
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
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Yangi Konkurs Yaratish</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      <div className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        activeContest
          ? 'bg-gradient-to-r from-secondary-container/20 via-surface-container to-surface-container-high border-secondary/40 shadow-[0_0_25px_rgba(5,213,158,0.15)]'
          : 'bg-surface-container-high border-white/10'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            activeContest ? 'bg-secondary/20 text-secondary' : 'bg-surface-container text-on-surface-variant'
          }`}>
            <span className="material-symbols-outlined text-2xl">
              {activeContest ? 'check_circle' : 'pause_circle'}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeContest ? 'bg-secondary animate-ping' : 'bg-on-surface-variant'}`}></span>
              <span className="font-mono text-xs uppercase font-bold tracking-wider text-white">
                Platformadagi Holat: {activeContest ? 'FAOL VA ISHLAMOQDA' : 'TO\'XTATILGAN (NOFAOL)'}
              </span>
            </div>
            <span className="text-xs text-on-surface-variant mt-0.5">
              {activeContest
                ? `Joriy faol konkurs: "${activeContest.title}" (Fond: ${formatUZS(activeContest.prize_pool)} UZS, Tugashiga: ${activeContest.days_left || 0} kun qoldi)`
                : 'Hozirda foydalanuvchilarga faol konkurs ko\'rinmayapti (Menubardan ham yashirilgan). Kerakli konkursni yoqishingiz mumkin.'}
            </span>
          </div>
        </div>

        {activeContest && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setRandomizerContest(activeContest)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black font-headline font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">casino</span>
              <span>🎬 Jonli Randomizer (Efirga Olish)</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleActive(activeContest)}
              className="px-3.5 py-2.5 rounded-xl bg-error/20 hover:bg-error/30 text-error border border-error/30 font-headline font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">stop_circle</span>
              <span>To'xtatish</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'list'
              ? 'bg-surface-container-high text-white border border-white/10 shadow-sm'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
          <span>Konkurslar Ro'yxati ({contests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'bg-surface-container-high text-secondary border border-secondary/30 shadow-sm'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span>Ishtirokchilar va Chiptalar</span>
        </button>
      </div>

      {/* Tab 1: Contest Cards */}
      {activeTab === 'list' && (
        <>
          {loading ? (
            <div className="py-16 flex justify-center text-on-surface-variant">
              <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : contests.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center gap-3 border border-white/5">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">event_busy</span>
              <span className="text-sm text-on-surface-variant font-medium">Hozircha hech qanday musobaqa yaratilmagan</span>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-2 px-4 py-2 rounded-xl bg-primary-container text-white text-xs font-bold uppercase shadow-neon-red"
              >
                Birinchi Musobaqani Yaratish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {contests.map((c) => {
                const isCurrentActive = c.is_active;
                return (
                  <div
                    key={c.id}
                    className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 shadow-xl ${
                      isCurrentActive
                        ? 'border-secondary/40 bg-surface-container-low shadow-[0_0_20px_rgba(5,213,158,0.08)]'
                        : 'border-white/5 opacity-85 hover:opacity-100 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Card Header: Title & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-headline font-bold text-white text-base leading-snug">
                            {c.title}
                          </h3>
                          <span className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                            {c.description || "Tavsif ko'rsatilmagan"}
                          </span>
                        </div>

                        {/* Direct Toggle Switch on Card */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                              isCurrentActive
                                ? 'bg-secondary text-black shadow-[0_0_12px_rgba(5,213,158,0.4)]'
                                : 'bg-surface-container-high text-on-surface-variant hover:text-white border border-white/10'
                            }`}
                            title={isCurrentActive ? "To'xtatish uchun bosing" : "Faollashtirish uchun bosing"}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{isCurrentActive ? 'FAOL' : 'NOFAOL'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Rules preview badge if present */}
                      {c.rules && (
                        <div className="p-2.5 rounded-xl bg-surface-container-lowest/80 border border-white/5 flex flex-col gap-1">
                          <span className="text-[10px] text-secondary font-mono uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">checklist</span>
                            Shartlar & Talablar:
                          </span>
                          <span className="text-[11px] text-on-surface-variant line-clamp-2 whitespace-pre-line font-sans">
                            {c.rules}
                          </span>
                        </div>
                      )}

                      {/* Channel & CTA preview */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                        {c.channel_link && (
                          <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-secondary border border-secondary/20 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">campaign</span>
                            {c.channel_link}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant">
                          Tugma: {c.cta_button_text || 'Shartlarni bajardim — Ishtirok etish'}
                        </span>
                      </div>

                      {/* Prize Fund Breakdown (Dynamic Prizes Showcase) */}
                      <div className="p-3 rounded-xl bg-surface-container-lowest border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-xs text-on-surface-variant font-mono">Jami Sovrin Jamg'armasi:</span>
                          <div className="flex items-center gap-2">
                            {c.winners && c.winners.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-400 text-[10px] font-bold">
                                🎉 G'oliblar: {c.winners.length} ta
                              </span>
                            )}
                            <span className="font-headline font-bold text-secondary text-sm neon-glow-green">
                              {formatUZS(c.prize_pool)} UZS
                            </span>
                          </div>
                        </div>

                        {c.prizes_config && Array.isArray(c.prizes_config) && c.prizes_config.length > 0 ? (
                          <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(c.prizes_config.length, 4)} gap-2 text-center text-xs`}>
                            {c.prizes_config.map((pz, pIdx) => {
                              const rankColors = [
                                'text-amber-400',
                                'text-slate-300',
                                'text-amber-700',
                                'text-teal-400',
                                'text-purple-400',
                              ];
                              const colorClass = rankColors[pIdx % rankColors.length];
                              const rankMedals = ['🥇', '🥈', '🥉', '🎖️', '🎁'];
                              const medal = rankMedals[pIdx] || '🏆';

                              return (
                                <div key={pIdx} className="flex flex-col items-center p-1.5 rounded-lg bg-surface-container/60 border border-white/5">
                                  <span className={`${colorClass} font-bold text-[11px] truncate w-full`}>
                                    {medal} {pz.rank || pIdx + 1}-o'rin
                                  </span>
                                  {pz.is_cash !== false ? (
                                    <span className="font-mono text-white font-semibold text-xs mt-0.5">
                                      {formatUZS(pz.cash_amount || pz.estimated_value || 0)} UZS
                                    </span>
                                  ) : (
                                    <div className="flex flex-col items-center mt-0.5">
                                      <span className="font-semibold text-amber-300 text-xs truncate max-w-[120px]" title={pz.item_name}>
                                        {pz.item_name || "Moddiy Sovg'a"}
                                      </span>
                                      {Number(pz.estimated_value) > 0 && (
                                        <span className="text-[9px] font-mono text-on-surface-variant">
                                          ~{formatUZS(pz.estimated_value)} UZS
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={`grid ${Number(c.fourth_prize) > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-center text-xs`}>
                            <div className="flex flex-col">
                              <span className="text-amber-400 font-bold">🥇 1-o'rin</span>
                              <span className="font-mono text-white font-semibold">{formatUZS(c.first_prize)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-slate-300 font-bold">🥈 2-o'rin</span>
                              <span className="font-mono text-white font-semibold">{formatUZS(c.second_prize)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-amber-700 font-bold">🥉 3-o'rin</span>
                              <span className="font-mono text-white font-semibold">{formatUZS(c.third_prize)}</span>
                            </div>
                            {Number(c.fourth_prize) > 0 && (
                              <div className="flex flex-col">
                                <span className="text-teal-400 font-bold">🎖️ 4-o'rin</span>
                                <span className="font-mono text-white font-semibold">{formatUZS(c.fourth_prize)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dates & Participant stats */}
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                        <span>Muddat: {c.start_date ? new Date(c.start_date).toLocaleDateString() : '-'} dan {c.end_date ? new Date(c.end_date).toLocaleDateString() : '-'} gacha</span>
                        <span className="text-white font-bold">Ishtirokchilar: {c.participants_count || 0} ta</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewParticipants(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-secondary text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">groups</span>
                          <span>Ishtirokchilar ({c.participants_count || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRandomizerContest(c)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                          title="Jonli efirda g'oliblarni aniqlash"
                        >
                          <span className="material-symbols-outlined text-[16px]">casino</span>
                          <span>🎬 Randomizer</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">edit</span>
                          <span>Tahrirlash</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="px-2.5 py-1.5 rounded-lg text-error hover:bg-error/10 text-xs font-semibold flex items-center gap-1 transition-all"
                          title="O'chirish"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Participants / Tickets */}
      {activeTab === 'leaderboard' && (
        <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col gap-5 shadow-2xl">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex flex-col">
              <h3 className="font-headline font-bold text-white text-base">
                Konkurs Ishtirokchilari va Chiptalari
              </h3>
              <span className="text-xs text-on-surface-variant">
                Barcha rasmiy qatnashchilar ro'yxati. Ular jonli Randomizer barabanida tasodifiy g'olib bo'lish imkoniyatiga ega.
              </span>
            </div>

            {/* Contest Selector & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Contest Dropdown */}
              <select
                value={selectedContestId || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedContestId(id);
                  fetchParticipantsList(id, 1, participantSearch);
                }}
                className="px-3 py-2 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs font-mono outline-none focus:border-secondary cursor-pointer"
              >
                {contests.map((c) => (
                  <option key={c.id} value={c.id} className="bg-surface-container text-white">
                    {c.title} {c.is_active ? '★ (Faol)' : ''}
                  </option>
                ))}
              </select>

              {/* Search Box */}
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[16px] text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Ism, username yoki chipta..."
                  value={participantSearch}
                  onChange={(e) => {
                    setParticipantSearch(e.target.value);
                    fetchParticipantsList(selectedContestId, 1, e.target.value);
                  }}
                  className="pl-8 pr-3 py-2 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs outline-none focus:border-secondary w-56"
                />
              </div>

              <button
                type="button"
                onClick={() => fetchParticipantsList(selectedContestId, participantPage, participantSearch)}
                className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/10 text-white transition-all"
                title="Yangilash"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Participants Table */}
          {loadingParticipants ? (
            <div className="py-16 flex justify-center text-on-surface-variant">
              <span className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : participants.length === 0 ? (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              Ushbu konkursda hali ishtirokchilar mavjud emas yoki qidiruv bo'yicha hech kim topilmadi.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider border-b border-white/5">
                <div className="col-span-2 text-center">Chipta #</div>
                <div className="col-span-5">Foydalanuvchi</div>
                <div className="col-span-3">Telegram Username</div>
                <div className="col-span-2 text-right">Amallar</div>
              </div>

              {participants.map((p) => {
                const ticket = p.ticket_number || `#${String(p.id).padStart(4, '0')}`;
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-12 items-center px-3 py-2.5 rounded-xl bg-surface-container-lowest/80 hover:bg-surface-container-lowest border border-white/5 transition-all text-xs"
                  >
                    {/* Ticket */}
                    <div className="col-span-2 text-center">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-400/30 text-amber-400 font-mono font-bold text-xs">
                        {ticket}
                      </span>
                    </div>

                    {/* User */}
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.avatar_url ? getImageUrl(p.avatar_url) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                        alt={p.full_name}
                        className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100';
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline font-semibold text-white truncate">
                          {p.full_name}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          ID: {p.user_id} {p.joined_at ? `• ${new Date(p.joined_at).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Username */}
                    <div className="col-span-3 text-[11px] text-secondary font-mono">
                      {p.username ? `@${p.username}` : <span className="text-on-surface-variant">Mavjud emas</span>}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteParticipant(p)}
                        className="px-2.5 py-1 rounded-lg text-error hover:bg-error/10 border border-transparent hover:border-error/20 text-xs font-semibold flex items-center gap-1 transition-all"
                        title="Konkursdan chiqarish"
                      >
                        <span className="material-symbols-outlined text-[16px]">person_remove</span>
                        <span>O'chirish</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Component */}
              <Pagination
                currentPage={participantPage}
                totalPages={participantTotalPages}
                totalCount={participantTotalCount}
                pageSize={20}
                onPageChange={(target) => fetchParticipantsList(selectedContestId, target, participantSearch)}
              />
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Contest Modal with FULL Admin Control */}
      {(showCreateModal || editingContest) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="glass-card rounded-2xl border border-white/10 w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl animate-modal-pop overflow-hidden my-auto">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0 bg-surface-container-lowest/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">
                  {editingContest ? 'edit' : 'add_circle'}
                </span>
                <h3 className="font-headline font-bold text-white text-base uppercase">
                  {editingContest ? "Musobaqani Tahrirlash" : "Yangi Musobaqa Yaratish"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingContest(null);
                }}
                className="text-on-surface-variant hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="contest-manage-form" onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              {/* Contest Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Musobaqa Nomi:</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masalan: Haftalik Kiber Turnir"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-secondary"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Qisqa Tavsifi:</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ishtirokchilarga ko'rsatiladigan qisqa matn"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-secondary resize-none"
                />
              </div>

              {/* Contest Rules (Shartlar va Talablar) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-secondary font-mono font-bold">
                    Konkurs Shartlari & Talablari:
                  </label>
                  <span className="text-[10px] text-on-surface-variant">Har bir qatordan alohida punkt yozing</span>
                </div>
                <textarea
                  rows={3}
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder={"1. Rasmiy kanalga a'zo bo'lish\n2. Kamida 3 ta do'stingizni taklif qilish\n3. Barcha vazifalarni bajarish"}
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-secondary font-sans leading-relaxed resize-none"
                />
              </div>

              {/* Channel / Sponsor Link & CTA Button Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Homiy / Kanal Havolasi (ixtiyoriy):</label>
                  <input
                    type="text"
                    value={formData.channel_link}
                    onChange={(e) => setFormData({ ...formData, channel_link: e.target.value })}
                    placeholder="https://t.me/ishdaman_channel yoki @ishdaman_channel"
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-secondary font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Tugma Matni:</label>
                  <input
                    type="text"
                    value={formData.cta_button_text}
                    onChange={(e) => setFormData({ ...formData, cta_button_text: e.target.value })}
                    placeholder="Shartlarni bajardim — Ishtirok etish"
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Dynamic Prizes Configurator (Sovrinlar Boshqaruvi: Pul yoki Sovg'alar) */}
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-container-lowest border border-white/5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-400 text-lg">emoji_events</span>
                    <label className="text-xs text-white font-mono font-bold uppercase tracking-wider">
                      Sovrinlar Konfiguratsiyasi (Pul & Sovg'alar)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentPrizes = formData.prizes_config || [];
                      const nextRank = currentPrizes.length + 1;
                      setFormData({
                        ...formData,
                        prizes_config: [
                          ...currentPrizes,
                          {
                            rank: nextRank,
                            title: `${nextRank}-O'rin`,
                            type: 'cash',
                            item_name: '',
                            item_icon: 'emoji_events',
                            estimated_value: 500000,
                            is_cash: true,
                            cash_amount: 500000,
                          }
                        ]
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-secondary/15 hover:bg-secondary/25 border border-secondary/30 text-secondary text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>+ O'rin qo'shish</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {(formData.prizes_config || []).map((prize, idx) => {
                    const rankMedals = ['🥇', '🥈', '🥉', '🎖️', '🎁'];
                    const medal = rankMedals[idx] || '🏆';

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface-container/60 border border-white/5 flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                              {medal}
                            </span>
                            <input
                              type="text"
                              value={prize.title || `${idx + 1}-O'rin`}
                              onChange={(e) => {
                                const updated = [...(formData.prizes_config || [])];
                                updated[idx].title = e.target.value;
                                setFormData({ ...formData, prizes_config: updated });
                              }}
                              className="px-2 py-0.5 rounded bg-surface-container-high border border-white/10 text-white font-mono text-xs outline-none focus:border-secondary w-44"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Cash vs Item Switch */}
                            <div className="flex items-center rounded-lg bg-surface-container-high p-0.5 border border-white/5 text-[10px] font-mono">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(formData.prizes_config || [])];
                                  updated[idx].type = 'cash';
                                  updated[idx].is_cash = true;
                                  setFormData({ ...formData, prizes_config: updated });
                                }}
                                className={`px-2 py-1 rounded-md font-bold transition-all ${
                                  prize.is_cash !== false
                                    ? 'bg-secondary text-black shadow-sm'
                                    : 'text-on-surface-variant hover:text-white'
                                }`}
                              >
                                💰 Naqd Pul
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(formData.prizes_config || [])];
                                  updated[idx].type = 'item';
                                  updated[idx].is_cash = false;
                                  setFormData({ ...formData, prizes_config: updated });
                                }}
                                className={`px-2 py-1 rounded-md font-bold transition-all ${
                                  prize.is_cash === false
                                    ? 'bg-amber-400 text-black shadow-sm'
                                    : 'text-on-surface-variant hover:text-white'
                                }`}
                              >
                                🎁 Sovg'a / Buyum
                              </button>
                            </div>

                            {formData.prizes_config.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formData.prizes_config.filter((_, i) => i !== idx);
                                  // Re-index ranks
                                  const reindexed = updated.map((p, i) => ({ ...p, rank: i + 1 }));
                                  setFormData({ ...formData, prizes_config: reindexed });
                                }}
                                className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                                title="O'chirish"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Fields according to type */}
                        {prize.is_cash !== false ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <label className="text-[11px] text-on-surface-variant font-mono shrink-0">
                              Yutuq summasi (UZS):
                            </label>
                            <AmountInput
                              value={prize.cash_amount || prize.estimated_value || 0}
                              onChange={(val) => {
                                const updated = [...(formData.prizes_config || [])];
                                updated[idx].cash_amount = val;
                                updated[idx].estimated_value = val;
                                setFormData({ ...formData, prizes_config: updated });
                              }}
                              placeholder="2 500 000"
                              required
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container border border-white/10 text-white font-mono text-xs outline-none focus:border-secondary flex-1"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-on-surface-variant font-mono">
                                Sovg'a Nomi (masalan: iPhone 16 Pro, PlayStation 5):
                              </label>
                              <input
                                type="text"
                                required
                                value={prize.item_name || ''}
                                onChange={(e) => {
                                  const updated = [...(formData.prizes_config || [])];
                                  updated[idx].item_name = e.target.value;
                                  setFormData({ ...formData, prizes_config: updated });
                                }}
                                placeholder="iPhone 16 Pro Max 256GB"
                                className="px-2.5 py-1.5 rounded-lg bg-surface-container border border-white/10 text-white text-xs outline-none focus:border-secondary"
                              />
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-on-surface-variant font-mono">
                                Taxminiy Qiymati (UZS, ixtiyoriy):
                              </label>
                              <AmountInput
                                value={prize.estimated_value || 0}
                                onChange={(val) => {
                                  const updated = [...(formData.prizes_config || [])];
                                  updated[idx].estimated_value = val;
                                  setFormData({ ...formData, prizes_config: updated });
                                }}
                                placeholder="18 000 000"
                                className="px-2.5 py-1.5 rounded-lg bg-surface-container border border-white/10 text-white font-mono text-xs outline-none focus:border-secondary"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Real-time total calculated prize pool info */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                  <span className="text-on-surface-variant">Hisoblangan Jami Fond:</span>
                  <span className="font-bold text-secondary text-sm">
                    {formatUZS(
                      (formData.prizes_config || []).reduce((sum, p) => {
                        return sum + (p.is_cash !== false ? Number(p.cash_amount || 0) : Number(p.estimated_value || 0));
                      }, 0)
                    )} UZS
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Boshlanish Sanasi & Vaqti:</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-secondary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-mono">Tugash Sanasi & Vaqti:</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-white/5">
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-secondary rounded cursor-pointer"
                />
                <label htmlFor="is_active_check" className="text-xs text-white cursor-pointer select-none">
                  Ushbu konkursni darhol faollashtirish (Faol qilinsa, avvalgi boshqa konkurslar avtomatik to'xtatiladi)
                </label>
              </div>
            </form>

            {/* Fixed Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-end gap-2 bg-surface-container-lowest/80">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingContest(null);
                }}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-semibold transition-all"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                form="contest-manage-form"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-secondary-container text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-secondary transition-all disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-base">check</span>
                )}
                <span>{editingContest ? "Saqlash" : "Yaratish"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Randomizer Studio Modal for Screen Recording & Reels */}
      {randomizerContest && (
        <AdminRandomizerModal
          contest={randomizerContest}
          onClose={() => setRandomizerContest(null)}
          onWinnersSaved={() => {
            showToast("G'oliblar rasman tasdiqlandi, hisoblar to'ldirildi va Telegramdan tabriklandi!");
            fetchContests();
          }}
        />
      )}
    </div>
  );
}
