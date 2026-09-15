import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import Pagination from '../components/Pagination';
import { formatUZS } from '../utils/formatters';
import getImageUrl from '../utils/imageUrl';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function ModerationPage() {
  const { showToast } = useAdminAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Lock background scroll when image lightbox or reject modal is active
  useBodyScrollLock(!!selectedImage || !!rejectItem);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);


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
                        src={sub.user_avatar ? getImageUrl(sub.user_avatar) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                        alt={sub.user_name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100';
                        }}
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
                          {sub.task_verification_type === 'manual_username' || (sub.proof_data && sub.proof_data.startsWith('@'))
                            ? "Foydalanuvchi Username'i:"
                            : "User kiritgan ID / Matn:"}
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
                          onClick={() => {
                            setSelectedImage(getImageUrl(sub.screenshot_url));
                            setZoomLevel(1);
                          }}
                          className="relative h-44 rounded-xl overflow-hidden cursor-pointer group border border-white/10 bg-surface-container-lowest"
                        >
                          <img
                            src={getImageUrl(sub.screenshot_url)}
                            alt="Screenshot Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600';
                            }}
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

      {/* Fullscreen Responsive Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedImage(null);
            }
          }}
        >
          {/* Top Control Bar */}
          <div className="w-full px-3 py-2.5 sm:px-6 sm:py-3 bg-black/70 backdrop-blur-lg border-b border-white/10 flex items-center justify-between gap-2 z-10 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">image</span>
              <span className="text-white text-xs font-headline font-semibold truncate hidden sm:inline">
                Skrinshot Isboti
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-white text-xs flex items-center gap-1 border border-white/10 active:scale-95 transition-all"
                title="Kichiklashtirish"
              >
                <span className="material-symbols-outlined text-[18px]">zoom_out</span>
              </button>

              {/* Zoom Reset */}
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-secondary text-xs font-mono font-bold border border-white/10 min-w-[50px] text-center active:scale-95 transition-all"
                title="Asl 100% holatga qaytarish"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-white text-xs flex items-center gap-1 border border-white/10 active:scale-95 transition-all"
                title="Kattalashtirish"
              >
                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>

              {/* Open in New Tab */}
              <a
                href={getImageUrl(selectedImage)}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-tertiary text-xs font-semibold flex items-center gap-1 border border-white/10 active:scale-95 transition-all"
                title="Yangi oynada to'liq ochish"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span className="hidden sm:inline">Asl havola</span>
              </a>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-error-container/90 hover:bg-error-container text-white text-xs font-bold flex items-center gap-1 shadow-neon-red ml-1 active:scale-95 transition-all"
                title="Yopish (Esc)"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                <span className="hidden sm:inline">Yopish</span>
              </button>
            </div>
          </div>

          {/* Main Image Viewport with Pan & Scroll Support */}
          <div
            className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-2 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedImage(null);
              }
            }}
          >
            <div
              className="transition-transform duration-150 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={getImageUrl(selectedImage)}
                alt="Skrinshot Isboti"
                className="max-h-[82vh] max-w-[96vw] sm:max-w-[90vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/20 select-none cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel((prev) => (prev === 1 ? 1.5 : 1));
                }}
              />
            </div>
          </div>

          {/* Bottom Caption */}
          <div className="w-full py-2 bg-black/60 text-center text-[11px] text-on-surface-variant font-mono border-t border-white/5 shrink-0">
            Kattalashtirish uchun rasm ustiga bosing yoki tepada zoom/asl havola tugmalaridan foydalaning.
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="glass-card rounded-2xl border border-white/10 w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl animate-modal-pop overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-white/10 shrink-0 flex items-center justify-between bg-surface-container-lowest/60">
              <h3 className="font-headline font-bold text-white text-base">
                Arizani Rad Etish
              </h3>
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="text-on-surface-variant hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-3.5">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Foydalanuvchiga nima sababdan rad etilganini bildirish uchun sabab yozing:
              </p>
              <textarea
                rows="4"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masalan: Skrinshotda vazifa shartlari to'liq aks etmagan yoki boshqa hisobdan yuborilgan..."
                className="w-full p-3.5 rounded-xl bg-surface-container-lowest border border-white/10 text-white text-xs outline-none focus:border-error-container resize-none"
              ></textarea>
            </div>

            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-end gap-2 bg-surface-container-lowest/80">
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-semibold transition-all"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-5 py-2 rounded-xl bg-error-container text-white font-semibold text-xs shadow-neon-red hover:bg-error-container/90 active:scale-95 transition-all"
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
