"use client";
import React from "react";
import { RefreshCw, WifiOff } from "lucide-react";

interface ErrorRetryProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorRetry({ onRetry, message = "We couldn't load your cases. Please check your connection." }: ErrorRetryProps) {
  return (
    <div className="field-state">
      <WifiOff width={36} height={36} />
      <h2 className="field-state__title">Something went wrong</h2>
      <p className="field-state__desc">{message}</p>
      {onRetry && (
        <button className="field-primary-btn field-primary-btn--block" onClick={onRetry}>
          <RefreshCw width={16} height={16} /> Try Again
        </button>
      )}
    </div>
  );
}
