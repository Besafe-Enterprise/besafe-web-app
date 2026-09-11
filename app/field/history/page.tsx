"use client";

import React from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { useRouter } from "next/navigation";
import "@/styles/field.css";

export default function FieldHistoryPage() {
  const router = useRouter();

  return (
    <div className="field-home">
      <button className="field-back-btn" onClick={() => router.back()}>
        <ArrowLeft width={16} height={16} /> Back
      </button>
      <div className="field-home__greeting">
        <h1>Case History</h1>
        <p>Resolved and closed cases are managed by your agency admin.</p>
      </div>
      <EmptyState
        icon={<Lock width={40} height={40} />}
        title="Access restricted"
        description="Completed cases are only accessible through the agency command center. Contact your administrator if you need to review a closed case."
      />
    </div>
  );
}
