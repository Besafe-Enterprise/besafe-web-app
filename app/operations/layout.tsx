"use client";

import React, { useState } from "react";
import { useAgencyGetMe } from "@/lib/hooks/auth/use-agency-auth";
import { useSocket } from "@/hooks/useSocket";
import { OperationsSidebar } from "@/components/operations/layout/Sidebar";
import { OperationsTopbar } from "@/components/operations/layout/TopBar";
import "@/styles/operations/base.css";
import "@/styles/operations/layout.css";
import "@/styles/operations/sidebar.css";
import "@/styles/operations/topbar.css";

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useAgencyGetMe();
  useSocket();

  return (
    <div className="operations-layout">
      <aside className="operations-sidebar">
        <OperationsSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <header className="operations-topbar">
        <OperationsTopbar onMenuToggle={() => setSidebarOpen(true)} />
      </header>

      <main className="operations-main">{children}</main>

      {sidebarOpen && (
        <div className="operations-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="operations-mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            <OperationsSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
