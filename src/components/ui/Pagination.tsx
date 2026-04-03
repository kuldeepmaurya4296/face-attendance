'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, total, limit, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate visible page numbers
  const getPages = () => {
    const visible: (number | '...')[] = [];
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) visible.push(i);
    } else {
      visible.push(1);
      if (page > 3) visible.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
        visible.push(i);
      }
      if (page < pages - 2) visible.push('...');
      visible.push(pages);
    }
    return visible;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-[13px] text-muted">
        Showing <span className="font-semibold text-foreground">{start}–{end}</span> of{' '}
        <span className="font-semibold text-foreground">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-md border border-border bg-surface hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-[13px] text-muted">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[32px] h-8 rounded-md text-[13px] font-medium transition-colors ${
                p === page
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border hover:bg-surface-hover'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-md border border-border bg-surface hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
