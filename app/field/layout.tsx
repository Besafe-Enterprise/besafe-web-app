"use client";
import React from "react";
import { useAgencyGetMe } from "@/lib/hooks/auth/use-agency-auth";
import { useSocket } from "@/hooks/useSocket";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import FieldShell from "@/components/field/layout/FieldShell";

export default function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAgencyGetMe();
  useSocket();
  const { user, agency } = useAgencyAuthStore();

  return (
    <FieldShell
      agencyName={agency?.name}
      workerName={user?.name}
      isOnline={true}
    >
      {children}
    </FieldShell>
  );
}
