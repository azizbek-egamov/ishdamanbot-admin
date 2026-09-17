import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import Pagination from '../components/Pagination';
import UserAuditModal from '../components/UserAuditModal';
import { formatUZS } from '../utils/formatters';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function PayoutsPage() {
  const { showToast } = useAdminAuth();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [auditUserId, setAuditUserId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal Inputs
  const [approveNote, setApproveNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [refundBalance, setRefundBalance] = useState(true);
  const [banUser, setBanUser] = useState(false);

  // Pagination 
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useBodyScrollLock(!!selectedPayout);

  const fetchPayouts = async (status = filterStatus, targetPage = page, targetPageSize = pageSize) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (status && status !== 'all') {
        queryParams.append('status', status);
      }
      queryParams.append('page', targetPage);
      queryParams.append('page_size', targetPageSize);

      const res = await api.get(`/wallet/admin/payouts/?${queryParams.toString()}`);
      if (res.data && res.data.results) {
        setPayouts(res.data.results);
        setTotalCount(res.data.count || 0);
        setTotalPages(res.data.total_pages || 1);
        setPage(res.data.current_page || targetPage);
      } else if (Array.isArray(res.data)) {
        setPayouts(res.data);
        setTotalCount(res.data.length);
        setTotalPages(1);
      }
    } catch (e) {
      console.error(e);
      showToast?.('Arizalarni yuklashda xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts(filterStatus, 1, pageSize);
  }, [filterStatus]);

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchPayouts(filterStatus, newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
    fetchPayouts(filterStatus, 1, newSize);
  };

  const handleOpenModal = (payout) => {
    setSelectedPayout(payout);
    setApproveNote('');
    setRejectNote('');
    setRefundBalance(true);
    setBanUser(false);
  };

  const handleProcess = async (action) => {
    if (!selectedPayout) return;
    setActionLoading(true);

    try {
      const payload = {
        action: action,
        note: action === 'approve' ? (approveNote || "Muvaffaqiyatli to'landi") : rejectNote,
        refund_balance: refundBalance,
        ban_user: banUser
      };

      const res = await api.post(`/wallet/admin/payouts/${selectedPayout.id}/process/`, payload);
      
      showToast?.(
        res.data?.message || (action === 'approve' ? "To'lov tasdiqlandi! ✅" : "So'rov rad etildi! ❌"),
        action === 'approve' ? 'success' : 'info'
      );

      setSelectedPayout(null);
      fetchPayouts(filterStatus);
    } catch (err) {
      console.error(err);
      showToast?.(err.response?.data?.error || 'Amalni bajarishda xatolik yuz berdi', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const copyCard = (card) => {
    navigator.clipboard.writeText(card.replace(/\s+/g, ''));
    showToast?.(`Karta raqami nusxalandi: ${card}`, 'success');
  };

  const getCardType = (card) => {
    const clean = (card || '').replace(/\s+/g, '');
    if (clean.startsWith('8600')) return { name: 'UZCARD', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30' };
    if (clean.startsWith('9860')) return { name: 'HUMO', color: 'text-amber-400 bg-amber-950/60 border-amber-500/30' };
    if (clean.startsWith('4')) return { name: 'VISA', color: 'text-blue-400 bg-blue-950/60 border-blue-500/30' };
    if (clean.startsWith('5')) return { name: 'MASTERCARD', color: 'text-red-400 bg-red-950/60 border-red-500/30' };
    return { name: 'KARTA', color: 'text-slate-300 bg-white/5 border-white/10' };
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in w-full min-h-screen">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-[#00be7e] flex items-center justify-center text-black shadow-neon-green">
            <span className="material-symbols-outlined text-[26px]">account_balance_wallet</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-xl text-white">
              Pul Yechish So'rovlari (Payouts)
            </h1>
            <span className="text-xs text-on-surface-variant">
              Foydalanuvchilarning karta hisoblariga so'ralgan to'lovlarni tekshirish, tasdiqlash va boshqarish
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-surface-container-lowest p-1.5 rounded-2xl border border-white/10 shadow-lg">
          {[
            { id: 'pending', label: 'Kutilayotganlar', icon: 'schedule', color: 'text-amber-400' },
            { id: 'approved', label: 'To\'langanlar', icon: 'check_circle', color: 'text-emerald-400' },
            { id: 'rejected', label: 'Rad etilganlar', icon: 'cancel', color: 'text-rose-400' },
            { id: 'all', label: 'Barchasi', icon: 'list', color: 'text-slate-300' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFilterChange(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                filterStatus === f.id
                  ? 'bg-gradient-to-r from-primary-container to-[#be0034] text-white shadow-neon-red'
                  : 'text-on-surface-variant hover:text-white bg-surface-container-low'
              }`}
            >
              <span className={`material-symbols-outlined text-[16px] ${f.color}`}>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table / Cards List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
          <span className="text-xs font-mono">So'rovlar yuklanmoqda...</span>
        </div>
      ) : payouts.length === 0 ? (
        <div className="bg-surface-container-lowest border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[42px] text-slate-600">receipt_long</span>
          <span className="text-sm font-semibold text-white">So'rovlar mavjud emas</span>
          <span className="text-xs text-on-surface-variant">Tanlangan holat bo'yicha hech qanday to'lov arizasi topilmadi.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {payouts.map((p) => {
            const isPending = p.status === 'pending';
            const isApproved = p.status === 'approved';
            const cardInfo = getCardType(p.card_number);

            return (
              <div
                key={p.id}
                className="bg-surface-container-lowest border border-white/5 hover:border-white/15 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all shadow-xl"
              >
                {/* User Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-surface-container-high border border-white/10 flex items-center justify-center text-primary-fixed-dim font-mono font-bold text-sm shrink-0 shadow">
                    #{p.id}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-headline font-bold text-white text-sm truncate">
                        {p.user_name || 'Noma\'lum'}
                      </span>
                      {p.user_username && (
                        <span className="text-[11px] font-mono text-slate-400">
                          @{p.user_username}
                        </span>
                      )}
                      {p.user_is_banned && (
                        <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30 text-[9px] font-mono font-bold uppercase">
                          BAN
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-on-surface-variant">
                      Telegram ID: <strong className="text-slate-300">{p.user_telegram_id}</strong> • {new Date(p.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${cardInfo.color}`}>
                    {cardInfo.name}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm tracking-wider">
                        {p.card_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyCard(p.card_number)}
                        className="text-on-surface-variant hover:text-white transition-colors"
                        title="Karta raqamini nusxalash"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-mono">
                      {p.card_holder_name || 'Egasi ko\'rsatilmagan'}
                    </span>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="flex flex-col lg:text-right">
                  <span className="font-headline font-extrabold text-base text-secondary">
                    {formatUZS(p.amount)} UZS
                  </span>
                  <div className="flex items-center gap-1.5 lg:justify-end">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isApproved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {p.status_display || (isApproved ? 'To\'landi' : isPending ? 'Kutilmoqda' : 'Rad etilgan')}
                    </span>
                  </div>
                </div>

                {/* Action Single Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(p)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg active:scale-95 ${
                      isPending
                        ? 'bg-gradient-to-r from-secondary to-[#00be7e] text-black shadow-neon-green hover:brightness-110'
                        : 'bg-surface-container-high hover:bg-surface-container text-white border border-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPending ? 'rate_review' : 'visibility'}
                    </span>
                    <span>{isPending ? 'Ko\'rish & Qaror Qabul Qilish' : 'Batafsil / Ko\'rish'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          <div className="glass-card rounded-2xl px-4 mt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2-SIDED COMPREHENSIVE PAYOUT MODAL */}
      {/* ==================================================================== */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-[#12141f] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl animate-modal-pop overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 shrink-0 bg-surface-container-lowest/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-[#00be7e] text-black flex items-center justify-center font-mono font-extrabold text-sm shadow-neon-green">
                  #{selectedPayout.id}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-base text-white">
                      Pul Yechish So'rovi #{selectedPayout.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      selectedPayout.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedPayout.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {selectedPayout.status_display || selectedPayout.status}
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-mono">
                    Mijoz: <strong className="text-white">{selectedPayout.user_name}</strong> (Telegram ID: {selectedPayout.user_telegram_id}) • {new Date(selectedPayout.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable 2-Columns Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              {/* Top Overview Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono uppercase text-on-surface-variant">So'ralgan Summa</span>
                  <span className="font-headline font-extrabold text-xl text-secondary">
                    {formatUZS(selectedPayout.amount)} UZS
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-mono uppercase text-on-surface-variant">Karta Ma'lumotlari</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-white text-sm">{selectedPayout.card_number}</span>
                    <button
                      type="button"
                      onClick={() => copyCard(selectedPayout.card_number)}
                      className="text-secondary hover:text-white"
                      title="Nusxalash"
                    >
                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {selectedPayout.card_holder_name || 'Egasi ko\'rsatilmagan'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-mono uppercase text-on-surface-variant">Mijoz Balansi</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatUZS(selectedPayout.user_balance || 0)} UZS
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedPayout.user_is_banned ? '🚫 Foydalanuvchi bloklangan' : '✅ Akkaunt faol'}
                  </span>
                </div>
              </div>

              {/* Prominent Quick Audit Action Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/40 to-[#141724] border border-cyan-500/30 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">history_edu</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-headline font-bold text-white">
                      Foydalanuvchining To'liq Tarixi &amp; Auditi
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Bajarilgan vazifalar, isbotlar, referallar, ruletka va barcha kirim/chiqimlar
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAuditUserId(selectedPayout.user_id || selectedPayout.user_telegram_id || selectedPayout.user)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[17px]">manage_search</span>
                  <span>To'liq Tarixni Ko'rish</span>
                </button>
              </div>

              {/* If Already Processed */}
              {selectedPayout.status !== 'pending' ? (
                <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${
                  selectedPayout.status === 'approved'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-headline font-bold text-sm">
                    <span className="material-symbols-outlined text-[20px]">
                      {selectedPayout.status === 'approved' ? 'check_circle' : 'cancel'}
                    </span>
                    <span>
                      Ushbu so'rov allaqachon {selectedPayout.status === 'approved' ? 'to\'lab berilgan' : 'rad etilgan'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">
                    Admin izohi: <strong>{selectedPayout.admin_note || '(izoh kiritilmagan)'}</strong>
                  </p>
                  {selectedPayout.processed_at && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Ko'rib chiqilgan vaqt: {new Date(selectedPayout.processed_at).toLocaleString()}
                    </span>
                  )}
                </div>
              ) : (
                /* 2-SIDED ACTIVE ACTION GRID */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* ========================================================= */}
                  {/* LEFT COLUMN: APPROVE (TASDIQLASH & TO'LASH) */}
                  {/* ========================================================= */}
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/20">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                        </div>
                        <h3 className="font-headline font-bold text-sm text-emerald-400">
                          1. To'lovni Tasdiqlash
                        </h3>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Mablag'ni mijozning <strong>{selectedPayout.card_number}</strong> kartasiga bank ilovangiz orqali o'tkazing va so'rovni tasdiqlang.
                      </p>

                      <div className="bg-black/40 p-3 rounded-xl border border-emerald-500/20 flex flex-col gap-1">
                        <span className="text-[10px] font-mono uppercase text-emerald-400/80">O'tkaziladigan Summa:</span>
                        <span className="font-headline font-extrabold text-2xl text-emerald-400">
                          {formatUZS(selectedPayout.amount)} UZS
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Admin Izohi (Mijozga Telegramda boradi):
                        </label>
                        <input
                          type="text"
                          value={approveNote}
                          onChange={(e) => setApproveNote(e.target.value)}
                          placeholder="Masalan: To'lov o'tkazildi, chek: 849302"
                          className="w-full bg-[#12141f] border border-emerald-500/30 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleProcess('approve')}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-secondary to-[#00be7e] hover:brightness-110 text-black font-headline font-bold text-xs uppercase tracking-wider shadow-neon-green flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>{actionLoading ? 'Saqlanmoqda...' : 'To\'lovni Tasdiqlash (Mablag\' O\'tkazildi)'}</span>
                    </button>
                  </div>

                  {/* ========================================================= */}
                  {/* RIGHT COLUMN: REJECT & MODERATION (RAD ETISH & CHORALAR) */}
                  {/* ========================================================= */}
                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg">
                    <div className="flex flex-col gap-3.5">
                      <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">gavel</span>
                        </div>
                        <h3 className="font-headline font-bold text-sm text-rose-400">
                          2. Rad Etish &amp; Qoidabuzarlik
                        </h3>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Rad Etish Sababi <span className="text-rose-400">*</span>:
                        </label>
                        <textarea
                          rows={2}
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="Masalan: Karta ma'lumotlari xato / Soxta referal aniqlandi..."
                          className="w-full bg-[#12141f] border border-rose-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none"
                        />
                      </div>

                      {/* Options: Refund / Ban */}
                      <div className="flex flex-col gap-2.5 bg-black/40 p-3.5 rounded-xl border border-rose-500/20">
                        {/* Refund balance toggle */}
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={refundBalance}
                            onChange={(e) => setRefundBalance(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-0 bg-slate-900 border-white/20"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200">
                              Mablag'ni balansga qaytarish
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {refundBalance
                                ? `Foydalanuvchi hisobiga ${formatUZS(selectedPayout.amount)} UZS qaytariladi (standart holat).`
                                : `⚠️ DIQQAT: Mablag' (${formatUZS(selectedPayout.amount)} UZS) balansga QAYTARILMAYDI (qoidabuzarlik uchun musodara qilinadi).`}
                            </span>
                          </div>
                        </label>

                        {/* Ban user toggle */}
                        <label className="flex items-start gap-2.5 cursor-pointer select-none pt-2 border-t border-white/5">
                          <input
                            type="checkbox"
                            checked={banUser}
                            onChange={(e) => setBanUser(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-0 bg-slate-900 border-white/20"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-red-300 flex items-center gap-1">
                              <span>Foydalanuvchini Bloklash (BAN)</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Foydalanuvchi bot va WebApp tizimidan butunlay chetlatiladi.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleProcess('reject')}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 text-white font-headline font-bold text-xs uppercase tracking-wider shadow-neon-red flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span>{actionLoading ? 'Saqlanmoqda...' : 'So\'rovni Rad Etish & Saqlash'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/5 shrink-0 flex items-center justify-end bg-surface-container-lowest/80">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. USER AUDIT FULL HISTORY MODAL (LAYERED ON TOP) */}
      {/* ==================================================================== */}
      {auditUserId && (
        <UserAuditModal
          userId={auditUserId}
          onClose={() => setAuditUserId(null)}
        />
      )}
    </div>
  );
}
