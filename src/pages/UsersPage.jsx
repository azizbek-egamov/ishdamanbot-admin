import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import AmountInput from '../components/AmountInput';
import Pagination from '../components/Pagination';
import { formatUZS } from '../utils/formatters';
import getImageUrl from '../utils/imageUrl';

export default function UsersPage() {
  const { showToast } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Balance edit modal
  const [balanceModalUser, setBalanceModalUser] = useState(null);
  const [actionType, setActionType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async (query = search, targetPage = page, targetPageSize = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/users/admin/users/?q=${encodeURIComponent(query)}&page=${targetPage}&page_size=${targetPageSize}`);
      if (res.data && res.data.results) {
        setUsers(res.data.results);
        setTotalCount(res.data.count || 0);
        setTotalPages(res.data.total_pages || 1);
        setPage(res.data.current_page || targetPage);
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
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
    fetchUsers(search, 1, pageSize);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search, 1, pageSize);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchUsers(search, newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
    fetchUsers(search, 1, newSize);
  };

  const handleToggleBan = async (user) => {
    const action = user.is_banned ? 'unban' : 'ban';
    let reason = '';
    if (action === 'ban') {
      const promptReason = window.prompt(`${user.full_name} ni bloklash sababini kiriting (ixtiyoriy):`, 'Qoidalarni buzganlik sababli');
      if (promptReason === null) return;
      reason = promptReason.trim() || 'Qoidalarni buzganlik sababli';
    } else {
      if (!window.confirm(`${user.full_name} ni blokdan chiqarmoqchimisiz?`)) return;
    }

    try {
      await api.post(`/users/admin/users/${user.id}/action/`, { action, reason });
      showToast(action === 'ban' ? 'Foydalanuvchi bloklandi!' : 'Blok olib tashlandi!');
      fetchUsers(search);
    } catch (e) {
      showToast('Xatolik yuz berdi');
    }
  };

  const handleSaveBalance = async (e) => {
    e.preventDefault();
    if (!balanceModalUser || !amount) return;

    try {
      setSaving(true);
      await api.post(`/users/admin/users/${balanceModalUser.id}/action/`, {
        action: actionType,
        amount: parseFloat(amount),
        note: note || (actionType === 'deposit' ? 'Admin balansi to\'ldirdi' : 'Admin jarimasi')
      });
      showToast('Balans muvaffaqiyatli yangilandi!');
      setBalanceModalUser(null);
      setAmount('');
      setNote('');
      fetchUsers(search);
    } catch (err) {
      const msg = err.response?.data?.error || 'Xatolik yuz berdi';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="font-headline font-bold text-white text-xl">
            Foydalanuvchilar Boshqaruvi
          </h2>
          <span className="text-xs text-on-surface-variant">
            A'zolar balansi, referallari va hisob xavfsizligi nazorati
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidiruv (Ism, ID, username)..."
            className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container w-64"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-white text-xs font-semibold"
          >
            Qidirish
          </button>
        </form>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-16 flex justify-center text-on-surface-variant">
          <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-on-surface-variant">
          Foydalanuvchilar topilmadi.
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-lowest text-on-surface-variant uppercase font-mono text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-4">Foydalanuvchi</th>
                  <th className="py-3.5 px-4">Telegram ID</th>
                  <th className="py-3.5 px-4">Joriy Balans</th>
                  <th className="py-3.5 px-4">Referallar</th>
                  <th className="py-3.5 px-4">Holat</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar_url ? getImageUrl(u.avatar_url) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80'}
                          alt={u.full_name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80';
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{u.full_name}</span>
                          <span className="text-[11px] text-on-surface-variant">@{u.username || 'username_yoq'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-on-surface-variant">
                      {u.telegram_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-secondary">
                      {formatUZS(u.balance)} UZS
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white">
                      {u.referrals_count || 0} nafar
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                        u.is_banned
                          ? 'bg-error-container text-white'
                          : 'bg-secondary-container/15 text-secondary'
                      }`}>
                        {u.is_banned ? 'Bloklangan' : 'Faol'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBalanceModalUser(u);
                            setActionType('deposit');
                            setAmount('');
                            setNote('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-white text-[11px] font-semibold border border-white/5"
                        >
                          Balans
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleBan(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                            u.is_banned
                              ? 'bg-secondary-container/20 text-secondary border-secondary/30'
                              : 'bg-error-container/20 text-error border-error/30'
                          }`}
                        >
                          {u.is_banned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-white/5 px-2">
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

      {/* Modify Balance Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-surface-container rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl animate-modal-pop">
            <h3 className="font-headline font-bold text-white text-base">
              Balansni Tahrirlash // {balanceModalUser.full_name}
            </h3>

            <form onSubmit={handleSaveBalance} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('deposit')}
                  className={`py-2 rounded-xl text-xs font-semibold ${
                    actionType === 'deposit'
                      ? 'bg-secondary-container text-on-secondary shadow-neon-green'
                      : 'bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  Mablag' Qo'shish (+)
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('penalty')}
                  className={`py-2 rounded-xl text-xs font-semibold ${
                    actionType === 'penalty'
                      ? 'bg-error-container text-white shadow-neon-red'
                      : 'bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  Jarima / Ayirish (-)
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-mono">Summa (UZS):</label>
                <AmountInput
                  value={amount}
                  onChange={(val) => setAmount(val)}
                  placeholder="Masalan: 50 000"
                  required
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white font-mono text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">Izoh / Sabab:</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Masalan: Maxsus mukofot yoki tanlov g'olibi"
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant text-xs"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary-container text-white font-bold text-xs shadow-neon-red"
                >
                  {saving ? 'Saqlanmoqda...' : 'Tasdiqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
