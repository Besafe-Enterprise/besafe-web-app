"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, ArrowLeft, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { exportApi, downloadBlob } from "@/lib/api";
import { reportShortId } from "@/lib/operations/utils";
import { toast } from "sonner";

export default function ReportPdfPreviewPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await exportApi.reportPdf(id);
      const u = URL.createObjectURL(b as Blob);
      setBlob(b as Blob);
      setUrl(u);
    } catch (e: unknown) {
      const raw = (e as { response?: { data?: Blob | { error?: string; message?: string } } })?.response?.data;
      let msg = "PDF export failed — try again";
      if (raw instanceof Blob) {
        try {
          const text = await raw.text();
          const j = JSON.parse(text);
          msg = j?.error || j?.message || text || msg;
        } catch {}
      } else if (raw && typeof raw === "object") msg = (raw as { error?: string }).error || (raw as { message?: string }).message || msg;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => { if (url) URL.revokeObjectURL(url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDownload = () => {
    if (!blob) return;
    downloadBlob(blob, `report-${id}.pdf`);
    toast.success("Download started");
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <Link href={`/operations/reports/${id}`} className="text-tertiary" style={{ fontSize: "var(--text-sm)", display: "inline-flex", alignItems: "center", gap: 6 }}><ArrowLeft width={14} height={14} /> Back to report {reportShortId(id)}</Link>
          <h1 className="page-header__title" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}><FileText width={18} height={18} />{reportShortId(id)} — PDF preview</h1>
          <p className="page-header__subtitle">Server-built PDF — same scalable engine as case export.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn--secondary btn--sm" onClick={load} disabled={loading}>{loading ? <Loader2 width={14} height={14} className="animate-spin" /> : null} Retry</button>
          <button type="button" className="btn btn--primary btn--sm" onClick={handleDownload} disabled={!blob}><Download width={14} height={14} /> Download PDF</button>
        </div>
      </div>
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Loader2 width={24} height={24} className="animate-spin" />
          <span className="text-secondary" style={{ fontSize: "var(--text-sm)" }}>Generating PDF…</span>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 12 }}><AlertTriangle width={20} height={20} style={{ color: "var(--color-warning)" }} /><div><div style={{ fontWeight: 700 }}>Could not generate PDF</div><div className="text-secondary" style={{ fontSize: "var(--text-sm)", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", background: "var(--color-surface-sunken)", padding: 12, borderRadius: 8, marginTop: 8 }}>{error}</div></div></div>
        </div>
      ) : url ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Preview</span>
            <button type="button" className="btn btn--primary btn--sm" onClick={handleDownload}><Download width={14} height={14} /> Download</button>
          </div>
          <iframe src={url} title={`Report ${id} PDF`} style={{ width: "100%", height: "calc(100vh - 220px)", minHeight: 600, border: "none", display: "block", background: "#fff" }} />
        </div>
      ) : null}
    </div>
  );
}
