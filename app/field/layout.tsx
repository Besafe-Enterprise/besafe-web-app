"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgencyGetMe } from "@/lib/hooks/auth/use-agency-auth";
import { useSocket } from "@/hooks/useSocket";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useOnline } from "@/lib/field/use-online";
import FieldShell from "@/components/field/layout/FieldShell";
import { LoadingScreen } from "@/components/field/shared/Loading";
import { flushQueue } from "@/lib/field/offline-queue";
import "@/styles/field.css";

const ALLOWED_ROLES = ["FIELD_AGENT"];

export default function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: profile, isLoading } = useAgencyGetMe();
  useSocket();
  const { user, agency } = useAgencyAuthStore();
  const online = useOnline();
  const router = useRouter();

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  // Flush offline queue when back online
  useEffect(() => {
    if (online) {
      flushQueue().catch(() => {});
    }
  }, [online]);

  const userRole = profile?.role || user?.role;

  useEffect(() => {
    if (isLoading) return;
    if (!profile) return;
    if (userRole && !ALLOWED_ROLES.includes(userRole)) {
      router.replace("/operations/command-center");
    }
  }, [profile, userRole, isLoading, router]);

  if (isLoading || !profile) {
    return <LoadingScreen />;
  }

  if (userRole && !ALLOWED_ROLES.includes(userRole)) {
    return <LoadingScreen label="Redirecting..." />;
  }

  return (
    <FieldShell agencyName={agency?.name} workerName={user?.name || user?.email} isOnline={online}>
      {children}
    </FieldShell>
  );
}
