"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgencyGetMe } from "@/lib/hooks/auth/use-agency-auth";
import { useSocket } from "@/hooks/useSocket";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { OperationsSidebar } from "@/components/operations/layout/Sidebar";
import { OperationsTopbar } from "@/components/operations/layout/TopBar";
import "@/styles/operations/base.css";
import "@/styles/operations/layout.css";
import "@/styles/operations/sidebar.css";
import "@/styles/operations/topbar.css";
import "@/styles/operations/misc.css";

const BLOCKED_ROLES = ["FIELD_AGENT"];

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profile, isLoading } = useAgencyGetMe();
  useSocket();
  const { user } = useAgencyAuthStore();
  const router = useRouter();

  const userRole = profile?.role || user?.role;

  useEffect(() => {
    if (isLoading) return;
    if (userRole && BLOCKED_ROLES.includes(userRole)) {
      router.replace("/field");
    }
  }, [profile, userRole, isLoading, router]);

  if (isLoading) {
    return (
      <div className="operations-layout">
        <main className="operations-main">
          <div style={{ padding: "var(--space-6)" }}>Loading...</div>
        </main>
      </div>
    );
  }

  if (userRole && BLOCKED_ROLES.includes(userRole)) {
    return (
      <div className="operations-layout">
        <main className="operations-main">
          <div style={{ padding: "var(--space-6)" }}>Redirecting to Field Worker App...</div>
        </main>
      </div>
    );
  }

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
