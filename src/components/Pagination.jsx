import React from 'react';
import { formatUZS } from '../utils/formatters';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) {
  if (totalCount === 0 && totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');

      pages.push(totalPages);
    }

    return pages;
  };

  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, currentPage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 select-none">
      {/* Items Range Info */}
      <div className="flex items-center gap-3 text-xs text-on-surface-variant font-mono">
        <span>
          Ko'rsatilmoqda: <b className="text-white">{startIdx}-{endIdx}</b> / Jami <b className="text-secondary">{formatUZS(totalCount)}</b> ta
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-on-surface-variant">Har sahifada:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-surface-container border border-white/10 text-white text-xs outline-none focus:border-primary-container font-mono cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-surface-container-high text-white">
                  {opt} ta
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons & Pages */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-surface-container hover:bg-surface-container-high text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            <span className="hidden sm:inline">Oldingi</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) => {
              if (page === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-on-surface-variant font-mono text-xs">
                    ...
                  </span>
                );
              }

              const isCurrent = page === currentPage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-primary-container text-white shadow-neon-red border border-primary-container'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-white/5'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-surface-container hover:bg-surface-container-high text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 active:scale-95"
          >
            <span className="hidden sm:inline">Keyingi</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
