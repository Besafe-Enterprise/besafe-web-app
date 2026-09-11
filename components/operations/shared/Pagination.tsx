"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}

export default function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const handlePage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    onPageChange?.(p);
  };

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        disabled={currentPage <= 1}
        onClick={() => handlePage(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft width={14} height={14} />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="pagination__ellipsis">
            …
          </span>
        ) : (
          <button
            key={p}
            className={`pagination__btn ${p === currentPage ? "pagination__btn--active" : ""}`}
            onClick={() => handlePage(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        className="pagination__btn"
        disabled={currentPage >= totalPages}
        onClick={() => handlePage(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight width={14} height={14} />
      </button>
      <span className="pagination__info">
        {start}–{end} of {totalItems.toLocaleString()}
      </span>
    </div>
  );
}
