import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatUZS } from '../utils/formatters';

export default function UserAuditModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tasks', 'transactions', 'referrals', 'withdrawals'
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const fetchAudit = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/users/admin/users/${userId}/audit/`);
        if (isMounted) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(err.response?.data?.error || "Foydalanuvchi ma'lumotlarini yuklab bo'lmadi");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAudit();
    return () => { isMounted = false; };
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in">
      <div className="bg-[#0f111a] border border-white/15 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-modal-pop">
        
        {/* ================================================================= */}
        {/* MODAL HEADER */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-surface-container-lowest/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
              <span className="material-symbols-outlined text-[24px]">manage_search</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline font-bold text-base sm:text-lg text-white truncate">
                  {data?.user?.full_name || 'Foydalanuvchi Tarixi'}
                </h2>
                {data?.user?.username && (
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30">
                    @{data.user.username}
                  </span>
                )}
                {data?.user?.is_banned ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                    ⛔ BLOKLANGAN
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    ✅ FAOL
                  </span>
                )}
              </div>
              <span className="text-xs text-on-surface-variant font-mono truncate">
                Telegram ID: <strong className="text-white">{data?.user?.telegram_id || userId}</strong> • DB ID: #{data?.user?.id || userId}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Tarixni yopish (X)"
          >
            ✕
          </button>
        </div>

        {/* ================================================================= */}
        {/* TABS NAVIGATION */}
        {/* ================================================================= */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-white/5 bg-[#141724] flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none text-xs font-medium">
          {[
            { id: 'overview', label: 'Umumiy Xulosa', icon: 'analytics', badge: null },
            { id: 'tasks', label: 'Vazifalar Tarixi', icon: 'task_alt', badge: data?.tasks?.count },
            { id: 'transactions', label: 'Tranzaksiyalar (Kirim/Chiqim)', icon: 'receipt_long', badge: data?.transactions?.count },
            { id: 'referrals', label: 'Referallar', icon: 'group', badge: data?.referrals?.count },
            { id: 'withdrawals', label: 'Pul Yechishlar', icon: 'payments', badge: data?.withdrawals?.count },
            { id: 'spins', label: 'Ruletka (Spin)', icon: 'casino', badge: data?.spins?.count },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-secondary to-[#00be7e] text-black font-bold shadow-neon-green'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === tab.id ? 'bg-black/30 text-black' : 'bg-white/10 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ================================================================= */}
        {/* MODAL BODY (SCROLLABLE) */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <span className="material-symbols-outlined text-[36px] animate-spin text-secondary">
                progress_activity
              </span>
              <span className="text-xs font-mono">Foydalanuvchi auditi yuklanmoqda...</span>
            </div>
          ) : error ? (
            <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">error</span>
              <span className="text-xs">{error}</span>
            </div>
          ) : data ? (
            <>
              {/* ------------------------------------------------------------- */}
              {/* TAB 1: OVERVIEW & FINANCIAL AUDIT */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-5">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Real Balance */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1">
                      <span className="text-[11px] font-mono uppercase text-slate-400">Hozirgi Balans</span>
                      <span className="font-headline font-extrabold text-xl text-secondary">
                        {formatUZS(data.financial.current_balance)} UZS
                      </span>
                      <span className="text-[10px] text-slate-400">Baza hisobidagi mablag'</span>
                    </div>

                    {/* Total In */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 flex flex-col gap-1">
                      <span className="text-[11px] font-mono uppercase text-emerald-400">Jami Kirim (Topgan)</span>
                      <span className="font-headline font-extrabold text-xl text-emerald-400">
                        +{formatUZS(data.financial.total_in)} UZS
                      </span>
                      <span className="text-[10px] text-slate-400">Barcha mukofot va yutuqlar</span>
                    </div>

                    {/* Total Out */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-rose-500/20 flex flex-col gap-1">
                      <span className="text-[11px] font-mono uppercase text-rose-400">Jami Yechilgan (Chiqim)</span>
                      <span className="font-headline font-extrabold text-xl text-rose-400">
                        {formatUZS(data.financial.total_out)} UZS
                      </span>
                      <span className="text-[10px] text-slate-400">Pul yechish arizalari</span>
                    </div>

                    {/* Math Consistency Check */}
                    <div className={`p-4 rounded-2xl border flex flex-col gap-1 ${
                      Math.abs(data.financial.calculated_balance - data.financial.current_balance) < 1
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-amber-950/30 border-amber-500/40'
                    }`}>
                      <span className="text-[11px] font-mono uppercase text-slate-300 flex items-center gap-1">
                        <span>Matematik Moslik</span>
                        {Math.abs(data.financial.calculated_balance - data.financial.current_balance) < 1 ? (
                          <span className="text-emerald-400 font-bold">✓ 100% Mos</span>
                        ) : (
                          <span className="text-amber-400 font-bold">⚠️ Farq bor</span>
                        )}
                      </span>
                      <span className="font-headline font-bold text-lg text-white">
                        {formatUZS(data.financial.calculated_balance)} UZS
                      </span>
                      <span className="text-[10px] text-slate-400">Tranzaksiyalar yig'indisi</span>
                    </div>
                  </div>

                  {/* Profile & Referrer Strip */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Info Details */}
                    <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex flex-col gap-2.5">
                      <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                        Profil Tafsilotlari
                      </h3>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Ro'yxatdan o'tgan:</span>
                          <span className="font-mono text-white">
                            {data.user.created_at ? new Date(data.user.created_at).toLocaleString() : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Ro'yxatdan o'tish manbasi:</span>
                          <span className="font-mono text-secondary uppercase font-bold">
                            {data.user.registration_source || 'telegram'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Referal kodi:</span>
                          <span className="font-mono text-white">{data.user.referral_code}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Kim orqali kelgan:</span>
                          <span className="font-semibold text-white">
                            {data.user.referred_by ? (
                              <span className="text-cyan-400">
                                {data.user.referred_by.full_name} (@{data.user.referred_by.username || data.user.referred_by.telegram_id})
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">To'g'ridan-to'g'ri (Hech kim)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown by Category */}
                    <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex flex-col gap-2.5">
                      <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-secondary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">pie_chart</span>
                        Daromad Manbalari Taqsimoti
                      </h3>
                      <div className="space-y-2 text-xs">
                        {data.financial.breakdown.length === 0 ? (
                          <span className="text-slate-400 italic">Hali operatsiyalar mavjud emas</span>
                        ) : (
                          data.financial.breakdown.map((b, i) => (
                            <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-none">
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                <span>{b.name}</span>
                                <span className="text-[10px] text-slate-400">({b.count} ta)</span>
                              </span>
                              <span className={`font-mono font-bold ${b.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {b.total >= 0 ? `+${formatUZS(b.total)}` : formatUZS(b.total)} UZS
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: TASKS HISTORY (VAZIFALAR) */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'tasks' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-300">
                      Jami bajarilgan / yuborilgan: <strong className="text-white">{data.tasks.count} ta</strong>
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {data.tasks.approved_count} Tasdiqlangan
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {data.tasks.pending_count} Kutilmoqda
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {data.tasks.rejected_count} Rad etilgan
                      </span>
                    </div>
                  </div>

                  {data.tasks.list.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Foydalanuvchi hech qanday vazifa bajarmagan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.tasks.list.map((task, idx) => {
                        const isAppr = task.status === 'approved';
                        const isPend = task.status === 'pending';

                        return (
                          <div
                            key={task.id || idx}
                            className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                              isAppr
                                ? 'bg-emerald-950/15 border-emerald-500/20'
                                : isPend
                                ? 'bg-amber-950/15 border-amber-500/20'
                                : 'bg-rose-950/15 border-rose-500/20'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-slate-300 shrink-0 mt-0.5">
                                #{idx + 1}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-headline font-bold text-sm text-white">
                                    {task.task_title}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.2 rounded bg-white/5 text-slate-300 uppercase font-mono">
                                    {task.category}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                                  <span>Yuborilgan: <strong className="text-slate-200">{task.submitted_at ? new Date(task.submitted_at).toLocaleString() : '-'}</strong></span>
                                  {task.reviewed_at && (
                                    <span>• Ko'rib chiqilgan: <strong className="text-slate-200">{new Date(task.reviewed_at).toLocaleString()}</strong></span>
                                  )}
                                </div>

                                {task.proof_data && (
                                  <div className="mt-1.5 p-2 rounded-lg bg-black/40 border border-white/5 text-xs text-cyan-300 font-mono">
                                    Isbot matni: <strong>{task.proof_data}</strong>
                                  </div>
                                )}

                                {task.admin_comment && (
                                  <div className="mt-1.5 p-2 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300">
                                    Admin izohi: <strong>{task.admin_comment}</strong>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
                              {task.screenshot_url && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(task.screenshot_url)}
                                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[15px]">image</span>
                                  <span>Skrinshot</span>
                                </button>
                              )}

                              <div className="flex flex-col items-end">
                                <span className="font-headline font-bold text-sm text-secondary">
                                  +{formatUZS(task.reward_amount)} UZS
                                </span>
                                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                                  isAppr
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : isPend
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {isAppr ? 'TASDIQLANDI' : isPend ? 'KUTILMOQDA' : 'RAD ETILDI'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: TRANSACTIONS CHRONOLOGICAL LEDGER */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'transactions' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Jami tranzaksiyalar: {data.transactions.count} ta</span>
                  </div>

                  {data.transactions.list.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Tranzaksiyalar tarixi bo'sh.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.transactions.list.map((tx, idx) => {
                        const isIncome = tx.amount >= 0;
                        return (
                          <div
                            key={tx.id || idx}
                            className="p-3 rounded-xl bg-[#141724] border border-white/5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                                <span className="material-symbols-outlined text-[16px]">
                                  {isIncome ? 'arrow_downward' : 'arrow_upward'}
                                </span>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-white truncate">
                                  {tx.description || tx.type_display}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'} • [{tx.type}]
                                </span>
                              </div>
                            </div>

                            <span className={`font-mono font-bold text-sm shrink-0 ${
                              isIncome ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {isIncome ? `+${formatUZS(tx.amount)}` : formatUZS(tx.amount)} UZS
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 4: REFERRALS */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'referrals' && (
                <div className="flex flex-col gap-3">
                  <div className="text-xs text-slate-400 font-mono">
                    Taklif qilingan referallar: <strong className="text-white">{data.referrals.count} ta</strong>
                  </div>

                  {data.referrals.list.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Foydalanuvchi hech kimni taklif qilmagan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.referrals.list.map((ref, idx) => (
                        <div
                          key={ref.id || idx}
                          className="p-3 rounded-xl bg-[#141724] border border-white/5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-white truncate">{ref.full_name}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                @{ref.username || 'yoq'} • TG ID: {ref.telegram_id} • {ref.created_at ? new Date(ref.created_at).toLocaleDateString() : '-'}
                              </span>
                            </div>
                          </div>

                          <span className="font-mono text-xs font-bold text-secondary shrink-0">
                            Balans: {formatUZS(ref.balance)} UZS
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 5: WITHDRAWALS */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'withdrawals' && (
                <div className="flex flex-col gap-3">
                  <div className="text-xs text-slate-400 font-mono">
                    Jami arizalar: <strong className="text-white">{data.withdrawals.count} ta</strong>
                  </div>

                  {data.withdrawals.list.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Pul yechish arizalari mavjud emas.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.withdrawals.list.map((wr, idx) => (
                        <div
                          key={wr.id || idx}
                          className="p-3.5 rounded-xl bg-[#141724] border border-white/10 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">
                                #{wr.id} — {wr.card_number}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase">
                                ({wr.card_holder_name || 'Egasi yoq'})
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              Yaratilgan: {wr.created_at ? new Date(wr.created_at).toLocaleString() : '-'}
                              {wr.admin_note && ` • Izoh: ${wr.admin_note}`}
                            </span>
                          </div>

                          <div className="flex flex-col items-end shrink-0">
                            <span className="font-headline font-bold text-sm text-secondary">
                              {formatUZS(wr.amount)} UZS
                            </span>
                            <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                              wr.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : wr.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {wr.status === 'approved' ? 'To\'langan' : wr.status === 'pending' ? 'Kutilmoqda' : 'Rad etilgan'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 6: SPINS */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'spins' && (
                <div className="flex flex-col gap-3">
                  <div className="text-xs text-slate-400 font-mono">
                    Jami ruletka aylantirishlar: <strong className="text-white">{data.spins.count} marta</strong> • Jami yutuq: <strong className="text-secondary">{formatUZS(data.spins.total_won)} UZS</strong>
                  </div>

                  {data.spins.list.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Ruletka aylantirilmagan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.spins.list.map((sp, idx) => (
                        <div
                          key={sp.id || idx}
                          className="p-3 rounded-xl bg-[#141724] border border-white/5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-amber-400">casino</span>
                            <span className="font-semibold text-white">{sp.reward_label}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({sp.created_at ? new Date(sp.created_at).toLocaleString() : '-'})
                            </span>
                          </div>

                          <span className="font-mono font-bold text-secondary text-xs">
                            +{formatUZS(sp.reward_amount)} UZS
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ================================================================= */}
        {/* MODAL FOOTER */}
        {/* ================================================================= */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-surface-container-lowest/90 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Foydalanuvchi to'liq xavfsizlik va moliyaviy auditi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer ml-auto"
          >
            Yopish (Tarixdan Chiqish)
          </button>
        </div>
      </div>

      {/* Screenshot Preview Sub-modal (if clicked) */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={previewImage.startsWith('http') ? previewImage : `https://core.ishdaman.uz${previewImage}`}
              alt="Proof"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/20 shadow-2xl"
            />
            <span className="mt-2 text-xs text-slate-400 font-mono">Yopish uchun istalgan joyni bosing</span>
          </div>
        </div>
      )}
    </div>
  );
}
