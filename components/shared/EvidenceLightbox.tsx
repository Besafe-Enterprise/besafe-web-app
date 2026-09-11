"use client";
import React from "react";
import { X, Download, ExternalLink } from "lucide-react";

export type EvidenceLightboxItem = {
  url: string;
  type?: string;
  name?: string;
};

function isImage(type?: string, url?: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("image") || t === "photo") return true;
  return /\.(jpe?g|png|webp|gif|heic|bmp|svg)(\?|$)/i.test(url || "");
}
function isVideo(type?: string, url?: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("video")) return true;
  return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url || "");
}
function isAudio(type?: string, url?: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("audio")) return true;
  return /\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/i.test(url || "");
}
function isPdf(type?: string, url?: string, name?: string) {
  const t = (type || "").toLowerCase();
  const n = (name || "").toLowerCase();
  return t.includes("pdf") || /\.pdf(\?|$)/i.test(url || "") || /\.pdf$/i.test(n);
}

export default function EvidenceLightbox({ item, onClose }: { item: EvidenceLightboxItem | null; onClose: () => void }) {
  if (!item) return null;
  const { url, type, name } = item;
  const showImage = isImage(type, url);
  const showVideo = !showImage && isVideo(type, url);
  const showAudio = !showImage && !showVideo && isAudio(type, url);
  const showPdf = !showImage && !showVideo && !showAudio && isPdf(type, url, name);
  const [downloading, setDownloading] = React.useState(false);
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <style>{`@media(min-width:768px){.evidence-lightbox{padding-left:92px !important}}@media(min-width:1100px){.evidence-lightbox{padding-left:272px !important}}`}</style>
      <div className="modal-backdrop evidence-lightbox" onClick={onClose} style={{ zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: "72px 16px 24px 16px" }}>
      <div className="modal" style={{ maxWidth: 860, width: "min(94vw, 860px)", maxHeight: "calc(100vh - 96px)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name || (showImage ? "Image" : showVideo ? "Video" : showAudio ? "Audio" : "Document")}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}><X width={14} height={14} /></button>
        </div>
        <div style={{ flex: 1, overflow: "auto", background: "var(--color-surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
          {showImage ? (
            <img src={url} alt={name || "evidence"} style={{ maxWidth: "100%", maxHeight: "70vh", display: "block", objectFit: "contain" }} />
          ) : showVideo ? (
            <video src={url} controls autoPlay style={{ width: "100%", maxHeight: "70vh", display: "block", background: "#000" }} />
          ) : showAudio ? (
            <div style={{ padding: 24, width: "100%" }}>
              <audio src={url} controls autoPlay style={{ width: "100%" }} />
            </div>
          ) : showPdf ? (
            <iframe src={url} title={name || "document"} style={{ width: "100%", height: "70vh", border: "none", background: "#fff" }} />
          ) : (
            <div style={{ padding: 24, textAlign: "center" }}>
              <p className="text-secondary" style={{ fontSize: "var(--text-sm)", marginBottom: 12 }}>Preview not available for this file type.</p>
              <a href={url} target="_blank" rel="noreferrer" className="btn btn--primary btn--sm"><ExternalLink width={14} height={14} /> Open in new tab</a>
            </div>
          )}
        </div>
        <div style={{ padding: 12, display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--color-border)", flexShrink: 0 }}>
          <button type="button" onClick={handleDownload} disabled={downloading} className="btn btn--secondary btn--sm"><Download width={14} height={14} /> {downloading ? "Downloading..." : "Download"}</button>
          <button type="button" className="btn btn--primary btn--sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
    </>
  );
}
