import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import Pagination from '../components/Pagination';
import { formatUZS } from '../utils/formatters';

export default function ModerationPage() {
  const { showToast } = useAdminAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Reject modal state
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchSubmissions = async (targetPage = page, targetPageSize = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/tasks/admin/submissions/pending/?page=${targetPage}&page_size=${targetPageSize}`);
      if (res.data && res.data.results) {
        setSubmissions(res.data.results);
        setTotalCount(res.data.count || 0);
        setTotalPages(res.data.total_pages || 1);
        setPage(res.data.current_page || targetPage);
      } else if (Array.isArray(res.data)) {
        setSubmissions(res.data);
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
    fetchSubmissions(1, pageSize);
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchSubmissions(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
    fetchSubmissions(1, newSize);
  };

  const handleApprove = async (sub) => {
    try {
      setProcessingId(sub.id);
      await api.post(`/tasks/admin/submissions/${sub.id}/review/`, {
        action: 'approve'
      });
      showToast(`${sub.user_name} uchun ${formatUZS(sub.task_reward)} UZS o'tkazildi!`);
      setSubmissions((prev) => prev.filter((item) => item.id !== sub.id));
    } catch (err) {
      showToast('Tasdiqlashda xatolik yuz berdi');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectItem) return;
    try {
      setProcessingId(rejectItem.id);
      await api.post(`/tasks/admin/submissions/${rejectItem.id}/review/`, {
        action: 'reject',
        reason: rejectReason || 'Talablar to\'liq bajarilmagan'
      });
      showToast('Ariza rad etildi');
      setSubmissions((prev) => prev.filter((item) => item.id !== rejectItem.id));
      setRejectItem(null);
      setRejectReason('');
    } catch (err) {
      showToast('Rad etishda xatolik yuz berdi');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="font-headline font-bold text-white text-xl">
            Moderatsiya Navbati (Jonli)
          </h2>
          <span className="text-xs text-on-surface-variant">
            Kutilayotgan skrinshotlar va foydalanuvchilar arizalari
          </span>
        </div>

        <button
          type="button"
          onClick={fetchSubmissions}
          className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Yangilash</span>
        </button>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-16 flex justify-center text-on-surface-variant">
          <span className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : submissions.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary-container/10 text-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">done_all</span>
          </div>
          <span className="font-headline font-bold text-white text-base">
            Barcha vazifalar ko'rib chiqilgan!
          </span>
          <p className="text-xs text-on-surface-variant">
            Ayni paytda moderatsiyada yangi skrinshot yoki arizalar mavjud emas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between shadow-xl"
              >
                <div>
                  {/* User & Task Info Header */}
                  <div className="p-4 border-b border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={sub.user_avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                        alt={sub.user_name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline font-semibold text-white text-xs truncate">
                          {sub.user_name}
                        </span>
                        <span className="font-mono text-[10px] text-secondary">
                          ID: {sub.user_telegram_id}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-secondary-container/15 text-secondary border border-secondary/30 font-mono text-xs font-bold shrink-0">
                      +{formatUZS(sub.task_reward)} UZS
                    </span>
                  </div>

                  {/* Task Title */}
                  <div className="px-4 py-2 bg-surface-container-lowest/60 border-b border-white/5">
                    <span className="text-[11px] text-on-surface-variant">Vazifa: </span>
                    <span className="text-xs font-semibold text-white">{sub.task_title}</span>
                  </div>

                  {/* Proof Section */}
                  <div className="p-4 flex flex-col gap-2">
                    {sub.proof_data && (
                      <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-white/5 flex flex-col gap-1">
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          User kiritgan ID / Matn:
                        </span>
                        <span className="text-xs font-mono font-bold text-tertiary select-all">
                          {sub.proof_data}
                        </span>
                      </div>
                    )}

                    {sub.screenshot_url && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          Yuklangan Skrinshot:
                        </span>
                        <div
                          onClick={() => setSelectedImage(sub.screenshot_url)}
                          className="relative h-44 rounded-xl overflow-hidden cursor-pointer group border border-white/10"
                        >
                          <img
                            src={sub.screenshot_url}
                            alt="Screenshot Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity gap-1 backdrop-blur-xs">
                            <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                            <span>Kattalashtirish</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <span className="text-[10px] text-on-surface-variant font-mono mt-1">
                      Yuborildi: {new Date(sub.submitted_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={processingId === sub.id}
                    onClick={() => {
                      setRejectItem(sub);
                      setRejectReason('');
                    }}
                    className="py-2.5 rounded-xl bg-surface-container-high hover:bg-error-container/30 text-error border border-error/30 text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    <span>Rad etish</span>
                  </button>

                  <button
                    type="button"
                    disabled={processingId === sub.id}
                    onClick={() => handleApprove(sub)}
                    className="py-2.5 rounded-xl bg-secondary-container hover:bg-[#00e297] text-on-secondary font-bold text-xs shadow-neon-green flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Tasdiqlash</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-xl px-4">
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

      {/* Fullscreen Image Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
            <img src={selectedImage} alt="Full preview" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-headline font-bold text-white text-base">
              Arizani Rad Etish
            </h3>
            <p className="text-xs text-on-surface-variant">
              Foydalanuvchiga nima sababdan rad etilganini bildirish uchun sabab yozing:
            </p>
            <textarea
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Masalan: Skrinshotda vazifa shartlari to'liq aks etmagan..."
              className="w-full p-3 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-primary-container resize-none"
            ></textarea>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant text-xs"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-xl bg-error-container text-white font-semibold text-xs shadow-neon-red"
              >
                Rad etishni tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
