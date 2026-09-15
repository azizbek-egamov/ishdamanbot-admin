import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import Pagination from '../components/Pagination';
import { formatUZS } from '../utils/formatters';

export default function PayoutsPage() {
  const { showToast } = useAdminAuth();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [actionId, setActionId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  const handleProcess = async (payoutId, action) => {
    try {
      setActionId(payoutId);
      await api.post(`/wallet/admin/payouts/${payoutId}/process/`, {
        action: action,
        note: action === 'approve' ? 'Muvaffaqiyatli to\'landi' : 'Karta ma\'lumotlari xato yoki bekor qilindi'
      });
      showToast(action === 'approve' ? 'To\'lov tasdiqlandi!' : 'To\'lov rad etildi va mablag\' qaytarildi!');
      fetchPayouts(filterStatus);
    } catch (err) {
      showToast('Amalni bajarishda xatolik yuz berdi');
    } finally {
      setActionId(null);
    }
  };

  const copyCard = (card) => {
    navigator.clipboard.writeText(card);
    showToast(`Karta nusxalandi: ${card}`);
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="font-headline font-bold text-white text-xl">
            Pul Yechish So'rovlari (Payouts)
          </h2>
          <span className="text-xs text-on-surface-variant">
            Uzcard va Humo kartalariga so'ralgan mablag'lar ro'yxati
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-surface-container-lowest p-1 rounded-xl border border-white/5">
          {[
            { id: 'pending', label: 'Kutilayotganlar' },
            { id: 'approved', label: 'To\'langanlar' },
            { id: 'rejected', label: 'Rad etilganlar' },
            { id: 'all', label: 'Barchasi' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFilterChange(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === f.id
                  ? 'bg-primary-container text-white shadow-neon-red'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="py-16 flex justify-center text-on-surface-variant">
          <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : payouts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-on-surface-variant">
          Ushbu holatda arizalar topilmadi.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {payouts.map((p) => {
            const isPending = p.status === 'pending';
            const isApproved = p.status === 'approved';

            return (
              <div
                key={p.id}
                className="glass-card rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5 transition-all hover:border-white/10"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container font-mono font-bold text-sm shrink-0">
                    UZ
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline font-semibold text-white text-sm truncate leading-tight">
                      {p.user_name}
                    </span>
                    <span className="font-mono text-[11px] text-on-surface-variant">
                      ID: {p.user_telegram_id} • {new Date(p.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Card Number & Holder */}
                <div className="flex items-center gap-3 bg-surface-container-lowest/80 px-4 py-2 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm tracking-wider">
                        {p.card_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyCard(p.card_number)}
                        className="text-on-surface-variant hover:text-white"
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

                {/* Amount */}
                <div className="flex flex-col md:text-right">
                  <span className="font-mono text-base font-bold text-secondary">
                    {formatUZS(p.amount)} UZS
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${
                    isApproved ? 'text-secondary' : isPending ? 'text-amber-400' : 'text-error'
                  }`}>
                    {isApproved ? 'To\'landi' : isPending ? 'Kutilmoqda' : 'Rad etilgan'}
                  </span>
                </div>

                {/* Actions */}
                {isPending && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={actionId === p.id}
                      onClick={() => handleProcess(p.id, 'reject')}
                      className="px-3 py-2 rounded-lg bg-surface-container hover:bg-error-container/30 text-error border border-error/30 text-xs font-semibold"
                    >
                      Rad etish
                    </button>
                    <button
                      type="button"
                      disabled={actionId === p.id}
                      onClick={() => handleProcess(p.id, 'approve')}
                      className="px-4 py-2 rounded-lg bg-secondary-container hover:bg-[#00e297] text-on-secondary font-bold text-xs shadow-neon-green"
                    >
                      To'landi
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="glass-card rounded-xl px-4 mt-2">
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
    </div>
  );
}
