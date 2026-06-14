"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Company, CompanyLink, Job, Activity, Asset, JobStatus, ActivityType, AssetType, PersonTitle } from "@/lib/notion";
import {
  Plus, X, ExternalLink, ChevronRight, ChevronLeft, ChevronDown,
  Search, Loader2, Mail, Phone, Video, FileText, MessageSquare, Star,
  ArrowUpRight, Check, AlertCircle, Link, User, Trash2,
  Send, Pencil, Building2, Briefcase, Paperclip, Globe, Archive, FilePlus,
} from "lucide-react";

// ── Mobile hook ───────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ── Constants ──────────────────────────────────────────────────────────────

const JOB_STATUSES: JobStatus[] = [
  "Want to apply", "Applied (no response)", "Applied (referred)", "In progress", "Closed",
];

const STATUS_COLORS: Record<JobStatus, { bg: string; text: string }> = {
  "Want to apply":        { bg: "#E5E7EB", text: "#6B7280" },
  "Applied (no response)":{ bg: "#DBEAFE", text: "#1D4ED8" },
  "Applied (referred)":   { bg: "#EDE9FE", text: "#6D28D9" },
  "In progress":          { bg: "#F5EAD5", text: "#7A5228" },
  "Closed":               { bg: "#F3F4F6", text: "#9CA3AF" },
};

const STATUS_BORDER: Record<JobStatus, string> = {
  "Want to apply":         "#9CA3AF",
  "Applied (no response)": "#3B82F6",
  "Applied (referred)":    "#7C3AED",
  "In progress":           "#D97706",
  "Closed":                "#D1D5DB",
};

const ACTIVITY_TYPES: ActivityType[] = [
  "Email sent", "Email received", "Phone call", "Video call",
  "Application submitted", "Interview", "Referral submitted", "Note",
];

const ACTIVITY_ICONS: Record<ActivityType, any> = {
  "Email sent": Mail,
  "Email received": Mail,
  "Phone call": Phone,
  "Video call": Video,
  "Application submitted": Send,
  "Interview": Star,
  "Referral submitted": ArrowUpRight,
  "Note": MessageSquare,
  "Job created": FilePlus,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  "Email sent": "#3B82F6",
  "Email received": "#8B5CF6",
  "Phone call": "#F59E0B",
  "Video call": "#06B6D4",
  "Application submitted": "#10B981",
  "Interview": "#DC2626",
  "Referral submitted": "#F97316",
  "Note": "#9CA3AF",
  "Job created": "#9CA3AF",
};

const ASSET_ICONS: Record<AssetType, any> = {
  "URL": Link,
  "Gmail link": Mail,
  "Document": FileText,
  "Contact": User,
};

const ASSET_COLORS: Record<AssetType, string> = {
  "URL": "#6B7280",
  "Gmail link": "#16A34A",
  "Document": "#EA580C",
  "Contact": "#6B7280",
};

const ASSET_BG: Record<AssetType, string> = {
  "URL": "#F3F4F6",
  "Gmail link": "#DCFCE7",
  "Document": "#FFEDD5",
  "Contact": "#F3F4F6",
};

const PERSON_TITLES: PersonTitle[] = ["Recruiter", "Hiring Manager", "Interviewer", "Referral", "Connection"];

// ── Design tokens ──────────────────────────────────────────────────────────

const C = {
  bg: "#F0EDE8",
  surface: "#FFFFFF",
  text: "#1C1917",
  muted: "#78716C",
  border: "#E7E5E0",
  green: "#1B3A2F",
  red: "#DC2626",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function deriveStatusChange(activityType: ActivityType, currentStatus: JobStatus): JobStatus | null {
  if (activityType === "Application submitted") {
    if (currentStatus === "In progress" || currentStatus === "Closed") return null;
    return "Applied (no response)";
  }
  if (activityType === "Referral submitted") {
    if (currentStatus === "In progress" || currentStatus === "Closed") return null;
    return "Applied (referred)";
  }
  if (["Email sent", "Email received", "Phone call", "Video call", "Interview"].includes(activityType)) {
    if (currentStatus === "Closed") return null;
    return "In progress";
  }
  return null;
}

const KNOWN_DOMAINS: Record<string, string> = {
  "linear": "linear.app", "notion": "notion.so", "vercel": "vercel.com",
  "figma": "figma.com", "stripe": "stripe.com", "shopify": "shopify.com",
  "airbnb": "airbnb.com", "uber": "uber.com", "lyft": "lyft.com",
  "pinterest": "pinterest.com", "snap": "snap.com", "snapchat": "snap.com",
  "discord": "discord.com", "slack": "slack.com", "zoom": "zoom.us",
  "dropbox": "dropbox.com", "box": "box.com", "atlassian": "atlassian.com",
  "github": "github.com", "gitlab": "gitlab.com", "bitbucket": "bitbucket.org",
  "netflix": "netflix.com", "spotify": "spotify.com", "apple": "apple.com",
  "google": "google.com", "meta": "meta.com", "amazon": "amazon.com",
  "microsoft": "microsoft.com", "adobe": "adobe.com", "salesforce": "salesforce.com",
  "oracle": "oracle.com", "ibm": "ibm.com", "intel": "intel.com",
  "nvidia": "nvidia.com", "amd": "amd.com", "qualcomm": "qualcomm.com",
  "twilio": "twilio.com", "datadog": "datadoghq.com", "cloudflare": "cloudflare.com",
  "hashicorp": "hashicorp.com", "mongodb": "mongodb.com", "elastic": "elastic.co",
  "databricks": "databricks.com", "snowflake": "snowflake.com", "confluent": "confluent.io",
  "asana": "asana.com", "airtable": "airtable.com", "coda": "coda.io",
  "webflow": "webflow.com", "framer": "framer.com", "loom": "loom.com",
  "miro": "miro.com", "canva": "canva.com", "duolingo": "duolingo.com",
};

function companyDomain(name: string): string {
  const key = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(inc|llc|corp|ltd|co|the)\b/g, "")
    .trim()
    .split(/\s+/)[0];
  return KNOWN_DOMAINS[key] || (key || "x") + ".com";
}

// ── Primitives ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`,
  borderRadius: 8, fontSize: 14, outline: "none", background: "#fff",
  color: C.text, boxSizing: "border-box",
};
const selectStyle: React.CSSProperties = { ...inputStyle };
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 88, resize: "vertical" as const, lineHeight: 1.6 };

// ── Mention helpers ────────────────────────────────────────────────────────

const MENTION_RE = /@\[([^\]]+)\]\(asset:([^)]+)\)/g;

function parseMentions(text: string): Array<{ type: "text" | "mention"; value: string; label?: string; assetId?: string }> {
  const parts: Array<{ type: "text" | "mention"; value: string; label?: string; assetId?: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    parts.push({ type: "mention", value: m[0], label: m[1], assetId: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

function NotesWithMentions({ notes, allAssets, onOpenAsset }: {
  notes: string;
  allAssets: Asset[];
  onOpenAsset: (a: Asset) => void;
}) {
  if (!notes) return null;
  const parts = parseMentions(notes);
  return (
    <span>
      {parts.map((p, i) => {
        if (p.type === "text") return <span key={i}>{p.value}</span>;
        const asset = allAssets.find(a => a.id === p.assetId);
        return (
          <span
            key={i}
            onClick={e => { e.stopPropagation(); if (asset) onOpenAsset(asset); }}
            style={{ textDecoration: "underline", textDecorationColor: "#1C1917", color: "#1C1917", cursor: asset ? "pointer" : "default", textUnderlineOffset: 2 }}
            title={asset ? undefined : "Asset not found"}
          >
            {p.label}
          </span>
        );
      })}
    </span>
  );
}

function MentionTextarea({ value, onChange, placeholder, assets }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  assets: Asset[];
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const filtered = assets.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));
  const isOpen = mentionStart !== null;

  const updateDropdownPos = () => {
    const ta = taRef.current;
    if (!ta) return;
    const rect = ta.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    const cur = e.target.selectionStart ?? v.length;
    onChange(v);
    const textBefore = v.slice(0, cur);
    const atIdx = textBefore.lastIndexOf("@");
    if (atIdx !== -1) {
      const segment = textBefore.slice(atIdx + 1);
      if (!/[\s]/.test(segment)) {
        setMentionStart(atIdx);
        setQuery(segment);
        setSelectedIdx(0);
        updateDropdownPos();
        return;
      }
    }
    setMentionStart(null);
    setQuery("");
  };

  const insertMention = (asset: Asset) => {
    const ta = taRef.current;
    if (!ta || mentionStart === null) return;
    const cur = ta.selectionStart ?? value.length;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cur);
    const inserted = `@[${asset.label}](asset:${asset.id}) `;
    onChange(before + inserted + after);
    setMentionStart(null);
    setQuery("");
    setTimeout(() => {
      ta.focus();
      const pos = before.length + inserted.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, Math.max(filtered.length - 1, 0))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" || e.key === "Tab") {
      if (filtered.length > 0) { e.preventDefault(); insertMention(filtered[selectedIdx] ?? filtered[0]); }
    }
    else if (e.key === "Escape") { e.preventDefault(); setMentionStart(null); setQuery(""); }
  };

  const overlayRef = useRef<HTMLDivElement>(null);
  const syncScroll = () => {
    if (overlayRef.current && taRef.current) overlayRef.current.scrollTop = taRef.current.scrollTop;
  };

  const sharedStyle: React.CSSProperties = {
    fontSize: 14, lineHeight: 1.6, padding: "9px 12px",
    border: `1px solid ${C.border}`, borderRadius: 8,
    boxSizing: "border-box", width: "100%", minHeight: 88,
    whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word",
    fontFamily: "inherit",
  };

  const renderOverlay = () => {
    const parts = parseMentions(value);
    return parts.map((p, i) =>
      p.type === "text"
        ? <span key={i} style={{ color: C.text }}>{p.value}</span>
        : <span key={i} style={{ background: "#1C1917", color: "#fff", borderRadius: 5, padding: "1px 4px" }}>{p.value}</span>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={overlayRef} aria-hidden style={{ ...sharedStyle, position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0, background: "#fff" }}>
        {renderOverlay()}{"\n"}
      </div>
      <textarea
        ref={taRef}
        style={{ ...sharedStyle, position: "relative", zIndex: 1, background: "transparent", color: "transparent", caretColor: C.text, resize: "vertical", outline: "none" }}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        onBlur={() => setTimeout(() => { setMentionStart(null); setQuery(""); }, 150)}
        placeholder={placeholder}
        spellCheck={false}
      />
      {isOpen && (
        <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 2000, maxHeight: 220, overflow: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 14px", fontSize: 13, color: C.muted }}>{assets.length === 0 ? "No assets available" : "No matching assets"}</div>
          ) : (
            filtered.map((a, i) => {
              const AIcon = ASSET_ICONS[a.type] || Link;
              return (
                <div key={a.id} onMouseDown={e => { e.preventDefault(); insertMention(a); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", cursor: "pointer", background: i === selectedIdx ? C.bg : "#fff", fontSize: 13, color: C.text }}
                  onMouseEnter={() => setSelectedIdx(i)}>
                  <AIcon size={13} color={C.muted} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Btn({ onClick, variant = "primary", children, disabled, style }: any) {
  const base: React.CSSProperties = {
    borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center",
    gap: 6, opacity: disabled ? 0.55 : 1, transition: "opacity .15s", ...style,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { ...base, background: C.green, color: "#fff", border: "none" },
    ghost:   { ...base, background: "#fff", color: C.text, border: `1px solid ${C.border}` },
    danger:  { ...base, background: "#fff", color: C.red, border: `1px solid ${C.red}` },
  };
  return <button style={variants[variant] || variants.primary} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Modal({ title, onClose, onBack, children, width = 560, isDirty = false }: {
  title: string; onClose: () => void; onBack?: () => void;
  children: React.ReactNode; width?: number; isDirty?: boolean;
}) {
  const isMobile = useIsMobile();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !isDirty) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, isDirty]);

  if (isMobile) {
    return (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 1000, pointerEvents: "auto" }}
        onClick={onClose}
      >
        {/* backdrop */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: entered ? 1 : 0, transition: "opacity 250ms ease-out" }} />
        {/* sheet */}
        <div
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "16px 16px 0 0", maxHeight: "90vh", overflow: "auto", transform: entered ? "translateY(0)" : "translateY(100%)", transition: "transform 250ms ease-out" }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 0", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
            {onBack && (
              <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, display: "flex", flexShrink: 0 }}>
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text, flex: 1, fontFamily: "Georgia, 'Times New Roman', serif" }}>{title}</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, display: "flex", flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ padding: "20px 20px 24px" }}>{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, opacity: entered ? 1 : 0, transition: "opacity 150ms ease" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 24px 0", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, display: "flex", flexShrink: 0 }}>
              <ChevronLeft size={18} />
            </button>
          )}
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text, flex: 1, fontFamily: "Georgia, 'Times New Roman', serif" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, display: "flex", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status, chevron, archived }: { status: JobStatus; chevron?: boolean; archived?: boolean }) {
  const { bg, text } = STATUS_COLORS[status] ?? STATUS_COLORS["Closed" as JobStatus] ?? { bg: "#F3F4F6", text: "#9CA3AF" };
  return (
    <span style={{ background: bg, color: text, borderRadius: 4, padding: chevron ? "4px 8px 4px 12px" : "4px 10px", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" as const, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", letterSpacing: "0.01em", opacity: archived ? 0.45 : 1 }}>
      {status}
      {chevron && <ChevronDown size={12} strokeWidth={2.5} />}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, margin: 0, marginBottom: 12 }}>
      {children}
    </h3>
  );
}

function CompanyLogo({ name, domain: domainOverride, logoUrl, size = 40, radius = 10, noBorder }: { name: string; domain?: string; logoUrl?: string; size?: number; radius?: number; noBorder?: boolean }) {
  const domain = domainOverride || companyDomain(name);
  const primary = logoUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const [src, setSrc] = useState(primary);
  const [err, setErr] = useState(false);
  useEffect(() => { setSrc(primary); setErr(false); }, [primary]);
  return (
    <div style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", flexShrink: 0, background: C.border, display: "flex", alignItems: "center", justifyContent: "center", border: noBorder ? "none" : "1px solid rgba(0,0,0,0.06)", boxSizing: "border-box" as const }}>
      {!err ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span style={{ fontSize: size * 0.38, fontWeight: 700, color: C.muted, fontFamily: "Georgia, serif" }}>
          {(name || "?")[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ── Add Company Modal ──────────────────────────────────────────────────────

function AddCompanyModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Company) => void }) {
  const [form, setForm] = useState({ name: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const u = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const res = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!data.error) { onSave(data); onClose(); }
  };

  const isDirty = form.name !== "" || form.notes !== "";
  return (
    <Modal title="New company" onClose={onClose} isDirty={isDirty}>
      <Field label="Company name *">
        <input style={inputStyle} value={form.name} onChange={u("name")} placeholder="e.g. Airbnb" autoFocus />
      </Field>
      <Field label="Notes">
        <textarea style={textareaStyle} value={form.notes} onChange={u("notes")} placeholder="Anything worth remembering…" />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={save} disabled={saving || !form.name}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save company
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Add Job Modal ──────────────────────────────────────────────────────────

type AddJobStep = "pick" | "url" | "paste" | "review";

function AddJobModal({ companies, onClose, onSave }: {
  companies: Company[];
  onClose: () => void;
  onSave: (j: Job, newCompany?: Company, newAsset?: Asset, createdActivity?: Activity) => void;
}) {
  const [step, setStep] = useState<AddJobStep>("pick");
  const [urlInput, setUrlInput] = useState("");
  const [pasteInput, setPasteInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", companyName: "", companyId: "", isNewCompany: false,
    status: "Want to apply" as JobStatus, notes: "", domain: "", location: "",
  });

  const handleCompanyInput = (value: string) => {
    const match = companies.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (match) {
      setForm(f => ({ ...f, companyName: value, companyId: match.id, isNewCompany: false }));
    } else {
      setForm(f => ({ ...f, companyName: value, companyId: "", isNewCompany: value.length > 0 }));
    }
  };

  const prefillFromExtracted = (extracted: any, url?: string) => {
    const match = companies.find(c => c.name.toLowerCase() === (extracted.company || "").toLowerCase());
    setForm({
      name: extracted.title || "",
      companyId: match?.id || "",
      companyName: extracted.company || "",
      isNewCompany: !match && !!extracted.company,
      status: "Want to apply",
      notes: extracted.notes || "",
      domain: extracted.domain || "",
      location: extracted.location || "",
    });
    if (url) setSourceUrl(url);
    setStep("review");
  };

  const runExtract = async (payload: { url?: string; text?: string }, url?: string) => {
    setExtracting(true);
    setExtractError("");
    try {
      const res = await fetch("/api/extract-job", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setExtractError(data.error || "Extraction failed."); setStep("pick"); }
      else prefillFromExtracted(data, url);
    } catch {
      setExtractError("Something went wrong. Try pasting the text instead.");
      setStep("pick");
    } finally {
      setExtracting(false);
    }
  };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    let companyId = form.companyId;
    let newCompanyObj: Company | undefined;

    if (form.isNewCompany && form.companyName) {
      const res = await fetch("/api/companies", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.companyName }),
      });
      const created = await res.json();
      if (!created.error) { companyId = created.id; newCompanyObj = created; }
    }

    const jobRes = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, companyId, status: form.status, notes: form.notes, location: form.location }),
    });
    const job = await jobRes.json();

    if (!job.error) {
      let newAsset: Asset | undefined;
      if (sourceUrl) {
        const assetRes = await fetch("/api/assets", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "URL", label: form.name, assetUrl: sourceUrl, jobId: job.id }),
        });
        const assetData = await assetRes.json();
        if (!assetData.error) newAsset = assetData;
      }
      const actRes = await fetch("/api/activities", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Job created", date: today(), notes: "", jobId: job.id }),
      });
      const actData = await actRes.json();
      const createdActivity: Activity | undefined = actData.error ? undefined : { ...actData, jobName: form.name };
      const co = newCompanyObj || companies.find(c => c.id === companyId);
      onSave({ ...job, companyName: co?.name || form.companyName }, newCompanyObj, newAsset, createdActivity);
      onClose();
    }
    setSaving(false);
  };

  const optionRow = (key: "url" | "paste" | "review", Icon: any, title: string, sub: string) => (
    <button key={key}
      onClick={() => { setExtractError(""); setStep(key); }}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#F7F6F4", border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.green; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 8, background: "#E8EDE9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={C.green} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</div>
        <div style={{ fontSize: 13, color: C.muted }}>{sub}</div>
      </div>
      <ChevronRight size={16} color={C.muted} />
    </button>
  );

  if (step === "pick") return (
    <Modal title="Add a job" onClose={onClose} isDirty={false}>
      {extractError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.red }}>
          {extractError}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {optionRow("url", Link, "Paste a URL", "From LinkedIn, a company site, or anywhere")}
        {optionRow("paste", FileText, "Paste job description", "Copy the full text of a job post")}
        {optionRow("review", Check, "Enter manually", "Fill in the details yourself")}
      </div>
    </Modal>
  );

  if (step === "url") return (
    <Modal title="Add a job" onClose={onClose} onBack={() => setStep("pick")} isDirty={urlInput !== ""}>
      <Field label="Job posting URL">
        <input style={inputStyle} value={urlInput} autoFocus onChange={e => setUrlInput(e.target.value)}
          placeholder="https://linkedin.com/jobs/… or company careers page"
          onKeyDown={e => { if (e.key === "Enter" && urlInput) runExtract({ url: urlInput }, urlInput); }}
        />
      </Field>
      <Btn onClick={() => runExtract({ url: urlInput }, urlInput)} disabled={extracting || !urlInput} style={{ width: "100%", justifyContent: "center" }}>
        {extracting ? <><Loader2 size={14} className="animate-spin" /> Fetching job details…</> : "Extract job info"}
      </Btn>
    </Modal>
  );

  if (step === "paste") return (
    <Modal title="Add a job" onClose={onClose} onBack={() => setStep("pick")} isDirty={pasteInput.trim() !== ""}>
      <Field label="Job description">
        <textarea style={{ ...textareaStyle, minHeight: 180 }} value={pasteInput} autoFocus onChange={e => setPasteInput(e.target.value)} placeholder="Paste the full job description here…" />
      </Field>
      <Btn onClick={() => runExtract({ text: pasteInput })} disabled={extracting || !pasteInput.trim()} style={{ width: "100%", justifyContent: "center" }}>
        {extracting ? <><Loader2 size={14} className="animate-spin" /> Extracting job details…</> : "Extract job info"}
      </Btn>
    </Modal>
  );

  // step === "review"
  const matchedCompany = companies.find(c => c.id === form.companyId);
  return (
    <Modal title="Review job details" onClose={onClose} onBack={() => setStep("pick")} isDirty={form.name !== "" || form.companyName !== ""}>
      <Field label="Job title *">
        <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Staff UX Designer" autoFocus />
      </Field>
      <Field label="Company *">
        <input style={inputStyle} value={form.companyName} onChange={e => handleCompanyInput(e.target.value)} placeholder="Company name" />
        {matchedCompany && !form.isNewCompany && (
          <div style={{ fontSize: 12, color: "#16A34A", marginTop: 4 }}>✓ Matched: {matchedCompany.name}</div>
        )}
        {form.isNewCompany && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <CompanyLogo name={form.companyName} domain={form.domain || undefined} size={18} radius={4} />
            <span style={{ fontSize: 12, color: C.muted }}>Will create new company</span>
          </div>
        )}
      </Field>
      <Field label="Location">
        <input style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. San Francisco, CA · Remote" />
      </Field>
      <Field label="Status">
        <select style={selectStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as JobStatus }))}>
          {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Notes">
        <textarea style={textareaStyle} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Role summary, referral info, anything relevant…" />
      </Field>
      {sourceUrl && (
        <div style={{ background: "#F7F6F4", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.muted }}>
          <span style={{ fontWeight: 600, color: C.text }}>URL will be saved as asset: </span>
          <span style={{ wordBreak: "break-all" }}>{sourceUrl}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={save} disabled={saving || !form.name || (!form.companyId && !form.isNewCompany)}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save job
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Add Activity Modal ─────────────────────────────────────────────────────

const ACTIVITY_PILL_TYPES: { type: ActivityType; label: string }[] = [
  { type: "Application submitted", label: "Applied" },
  { type: "Email sent", label: "Email sent" },
  { type: "Email received", label: "Email rcvd" },
  { type: "Phone call", label: "Phone" },
  { type: "Video call", label: "Video call" },
  { type: "Interview", label: "Interview" },
  { type: "Referral submitted", label: "Referral" },
  { type: "Note", label: "Note" },
];

function EditActivityModal({ activity, onClose, onSave, onDelete, assets = [] }: {
  activity: Activity; onClose: () => void;
  onSave: (a: Activity) => void;
  onDelete: (id: string) => void;
  assets?: Asset[];
}) {
  const [form, setForm] = useState({ type: activity.type, date: activity.date, notes: activity.notes });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/activities/${activity.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSave({ ...activity, ...form });
    onClose();
  };

  const del = async () => {
    await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
    onDelete(activity.id);
    onClose();
  };

  const isDirty = form.type !== activity.type || form.date !== activity.date || form.notes !== activity.notes;
  return (
    <Modal title="Edit activity" onClose={onClose} isDirty={isDirty}>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 8 }}>Type</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ACTIVITY_PILL_TYPES.map(({ type, label }) => {
            const Icon = ACTIVITY_ICONS[type];
            const active = form.type === type;
            return (
              <button key={type} onClick={() => setForm(f => ({ ...f, type }))}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: active ? C.text : "#F5F4F2", color: active ? "#fff" : C.muted, fontSize: 13, fontWeight: 500 }}>
                <Icon size={13} /> {label}
              </button>
            );
          })}
        </div>
      </div>
      <Field label="Date">
        <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </Field>
      <Field label="Notes">
        <MentionTextarea value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Details, call notes, email content…" assets={assets} />
      </Field>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Btn onClick={save} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
      {confirmDelete ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <span style={{ fontSize: 13, color: C.muted, flex: 1 }}>Delete this activity?</span>
          <Btn variant="ghost" onClick={() => setConfirmDelete(false)} style={{ padding: "5px 12px", fontSize: 13 }}>Cancel</Btn>
          <Btn variant="danger" onClick={del} style={{ padding: "5px 12px", fontSize: 13 }}>Delete</Btn>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 5, borderTop: `1px solid ${C.border}`, paddingTop: 14, width: "100%" }}>
          <Trash2 size={13} /> Delete activity
        </button>
      )}
    </Modal>
  );
}

function AddActivityModal({ jobId, jobName, onClose, onSave, assets = [] }: {
  jobId: string; jobName: string; onClose: () => void; onSave: (a: Activity) => void; assets?: Asset[];
}) {
  const [form, setForm] = useState({ type: "Note" as ActivityType, date: today(), notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/activities", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, jobId }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.error) { onSave({ ...data, jobName }); onClose(); }
  };

  const isDirty = form.notes !== "" || form.type !== "Note" || form.date !== today();
  return (
    <Modal title="Add activity" onClose={onClose} isDirty={isDirty}>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>For: <strong style={{ color: C.text }}>{jobName}</strong></div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Type</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ACTIVITY_PILL_TYPES.map(({ type, label }) => {
            const Icon = ACTIVITY_ICONS[type];
            const active = form.type === type;
            return (
              <button key={type} onClick={() => setForm(f => ({ ...f, type }))}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  borderRadius: 20, border: "none", cursor: "pointer",
                  background: active ? C.text : "#F5F4F2", color: active ? "#fff" : C.muted,
                  fontSize: 13, fontWeight: 500,
                }}>
                <Icon size={13} /> {label}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Date">
        <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </Field>
      <Field label="Notes">
        <MentionTextarea value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Details, call notes, email content…" assets={assets} />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={save} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Add Link Modal (company links) ─────────────────────────────────────────

const LINK_TYPES = ["Careers site", "Product site", "LinkedIn", "Press", "Other"] as const;
type LinkType = typeof LINK_TYPES[number];

function AddLinkModal({ onClose, onSave }: {
  onClose: () => void; onSave: (lnk: CompanyLink) => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [linkType, setLinkType] = useState<LinkType>("Careers site");

  const save = () => {
    if (!url.trim()) return;
    onSave({ label: label.trim() || linkType, url: url.trim(), type: linkType });
  };

  return (
    <Modal title="Add link" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Label</div>
          <input style={inputStyle} value={label} onChange={e => setLabel(e.target.value)} placeholder={`e.g. ${linkType}`} autoFocus />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>URL</div>
          <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." onKeyDown={e => { if (e.key === "Enter") save(); }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: C.muted, marginBottom: 10, textTransform: "uppercase" }}>Type</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LINK_TYPES.map(t => (
              <button key={t} onClick={() => setLinkType(t)}
                style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${linkType === t ? C.green : C.border}`, background: linkType === t ? C.green : "#fff", color: linkType === t ? "#fff" : C.text, fontSize: 13, cursor: "pointer", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <Btn onClick={save} disabled={!url.trim()} style={{ padding: "10px 20px", fontSize: 14 }}>Save</Btn>
          <Btn variant="ghost" onClick={onClose} style={{ padding: "10px 20px", fontSize: 14 }}>Cancel</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Asset Modal ────────────────────────────────────────────────────────

function AddAssetModal({ companies, jobs, linkTo, onClose, onSave }: {
  companies: Company[]; jobs: Job[];
  linkTo?: { companyId?: string; jobId?: string };
  onClose: () => void; onSave: (a: Asset) => void;
}) {
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [assetType, setAssetType] = useState<AssetType>("URL");
  const [form, setForm] = useState<any>({
    label: "", assetUrl: "",
    personName: "", personTitle: "" as PersonTitle | "", personEmail: "", personPhone: "", personLinkedin: "", personNotes: "",
    companyId: linkTo?.companyId || "", jobId: linkTo?.jobId || "",
  });
  const [saving, setSaving] = useState(false);
  const u = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const isPerson = assetType === "Contact";

  const save = async () => {
    if (assetType === "Gmail link" && !form.label.trim()) {
      alert("Please enter a label for this Gmail thread (e.g. the subject or who it's with).");
      return;
    }
    setSaving(true);
    const payload = { ...form, type: assetType };
    if (!payload.label) {
      payload.label = isPerson
        ? (payload.personName || "Contact")
        : (payload.assetUrl.slice(0, 60) + (payload.assetUrl.length > 60 ? "…" : "") || assetType);
    }
    const res = await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!data.error) { onSave(data); onClose(); }
  };

  const ASSET_OPTIONS: { type: AssetType; label: string; sub: string }[] = [
    { type: "URL", label: "URL", sub: "A link to a job posting or resource" },
    { type: "Gmail link", label: "Gmail", sub: "An email thread or conversation" },
    { type: "Document", label: "Document", sub: "A document, resume, or file" },
    { type: "Contact", label: "Contact", sub: "A contact: recruiter, HM, referral" },
  ];

  if (step === "pick") return (
    <Modal title="New asset" onClose={onClose} isDirty={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ASSET_OPTIONS.map(({ type, label, sub }) => {
          const Icon = ASSET_ICONS[type];
          return (
            <button key={type} onClick={() => { setAssetType(type); setStep("form"); }}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#F7F6F4", border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.green; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: ASSET_BG[type], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color={ASSET_COLORS[type]} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{sub}</div>
              </div>
              <ChevronRight size={16} color={C.muted} />
            </button>
          );
        })}
      </div>
    </Modal>
  );

  const TypeIcon = ASSET_ICONS[assetType];
  const assetFormDirty = form.label !== "" || form.assetUrl !== "" || form.personName !== "" || form.personEmail !== "" || form.personPhone !== "" || form.personLinkedin !== "" || form.personNotes !== "";
  return (
    <Modal title="New asset" onClose={onClose} onBack={() => setStep("pick")} isDirty={assetFormDirty}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ASSET_BG[assetType], color: ASSET_COLORS[assetType], padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, marginBottom: 20 }}>
        <TypeIcon size={12} /> {assetType}
      </div>

      {!isPerson && (
        <>
          <Field label={assetType === "Gmail link" ? "Label *" : "Label"}>
            <input style={inputStyle} value={form.label} onChange={u("label")} placeholder={assetType === "Gmail link" ? "e.g. subject line or who it's with" : "Optional"} autoFocus />
          </Field>
          <Field label="URL"><input style={inputStyle} value={form.assetUrl} onChange={u("assetUrl")} placeholder="https://…" /></Field>
        </>
      )}

      {isPerson && (
        <>
          <Field label="Name *"><input style={inputStyle} value={form.personName} onChange={u("personName")} placeholder="Full name" autoFocus /></Field>
          <Field label="Role">
            <select style={selectStyle} value={form.personTitle} onChange={u("personTitle")}>
              <option value="">— none —</option>
              {PERSON_TITLES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Email"><input style={inputStyle} value={form.personEmail} onChange={u("personEmail")} placeholder="name@company.com" /></Field>
            <Field label="Phone"><input style={inputStyle} value={form.personPhone} onChange={u("personPhone")} placeholder="+1 555 000-0000" /></Field>
          </div>
          <Field label="LinkedIn"><input style={inputStyle} value={form.personLinkedin} onChange={u("personLinkedin")} placeholder="https://linkedin.com/in/…" /></Field>
          <Field label="Notes"><textarea style={textareaStyle} value={form.personNotes} onChange={u("personNotes")} /></Field>
        </>
      )}

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Field label="Link to job">
          <select style={selectStyle} value={form.jobId} onChange={u("jobId")}>
            <option value="">— none —</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </Field>
        <Field label="Link to company">
          <select style={selectStyle} value={form.companyId} onChange={u("companyId")}>
            <option value="">— none —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={save} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Edit Asset Modal (view + edit) ─────────────────────────────────────────

function EditAssetModal({ asset, companies, jobs, onClose, onSave, onDelete, onNavigateCompany, onNavigateJob }: {
  asset: Asset; companies: Company[]; jobs: Job[];
  onClose: () => void; onSave: (updated: Asset) => void; onDelete: (id: string) => void;
  onNavigateCompany?: (c: Company) => void; onNavigateJob?: (j: Job) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({
    label: asset.label, type: asset.type, assetUrl: asset.assetUrl,
    personName: asset.personName, personTitle: asset.personTitle,
    personEmail: asset.personEmail, personPhone: asset.personPhone,
    personLinkedin: asset.personLinkedin, personNotes: asset.personNotes,
    companyId: asset.companyId, jobId: asset.jobId,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const u = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const isPerson = asset.type === "Contact";
  const isMobile = useIsMobile();
  const editIsDirty = editing && (
    form.label !== asset.label ||
    form.assetUrl !== asset.assetUrl ||
    form.personName !== asset.personName ||
    form.personTitle !== asset.personTitle ||
    form.personEmail !== asset.personEmail ||
    form.personPhone !== asset.personPhone ||
    form.personLinkedin !== asset.personLinkedin ||
    form.personNotes !== asset.personNotes ||
    form.companyId !== asset.companyId ||
    form.jobId !== asset.jobId
  );
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !editIsDirty) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, editIsDirty]);
  const linkedCompany = companies.find(c => c.id === asset.companyId);
  const linkedJob = jobs.find(j => j.id === asset.jobId);
  const displayLabel = isPerson ? (asset.personName || asset.label) : asset.label;
  const TypeIcon = ASSET_ICONS[asset.type];

  const save = async () => {
    setSaving(true);
    setSaveError("");
    const payload: any = { label: form.label, type: form.type, companyId: form.companyId, jobId: form.jobId };
    if (!isPerson) {
      payload.assetUrl = form.assetUrl;
    } else {
      payload.personName = form.personName;
      payload.personTitle = form.personTitle;
      payload.personEmail = form.personEmail;
      payload.personPhone = form.personPhone;
      payload.personLinkedin = form.personLinkedin;
      payload.personNotes = form.personNotes;
    }
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { setSaveError(data.error); } else { onSave(data); onClose(); }
  };

  const del = async () => {
    setDeleting(true);
    await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
    onDelete(asset.id);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: isMobile ? "16px 16px 0 0" : 12, width: "100%", maxWidth: isMobile ? "100%" : 520, maxHeight: isMobile ? "92vh" : "90vh", overflow: "auto", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", position: "relative" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: isMobile ? "20px 20px" : "24px 28px" }}>
          <button onClick={onClose} style={{ position: "absolute", right: isMobile ? 16 : 20, top: isMobile ? 16 : 20, background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
            <X size={18} />
          </button>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ASSET_BG[asset.type], color: ASSET_COLORS[asset.type], padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>
            <TypeIcon size={12} /> {asset.type}
          </div>

          {editing ? (
            <Field label="Label">
              <input style={{ ...inputStyle, fontSize: 18, fontFamily: "Georgia, serif" }} value={form.label} onChange={u("label")} />
            </Field>
          ) : (
            <h2 style={{ fontSize: 22, fontWeight: 600, fontFamily: "Georgia, 'Times New Roman', serif", color: C.text, marginBottom: 14 }}>{displayLabel}</h2>
          )}

          {!isPerson && (
            editing ? (
              <Field label="URL"><input style={inputStyle} value={form.assetUrl} onChange={u("assetUrl")} placeholder="https://…" /></Field>
            ) : asset.assetUrl ? (
              <div style={{ marginBottom: 16 }}>
                <a href={asset.assetUrl} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, color: "#2563EB", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, overflow: "hidden", maxWidth: 320 }}>
                  <ExternalLink size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {asset.type === "Gmail link" ? "Open in Gmail" : asset.assetUrl}
                  </span>
                </a>
              </div>
            ) : null
          )}

          {isPerson && !editing && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
              {asset.personTitle && <span style={{ color: C.muted, fontStyle: "italic" }}>{asset.personTitle}</span>}
              {asset.personEmail && <a href={`mailto:${asset.personEmail}`} style={{ color: "#2563EB", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><Mail size={14} />{asset.personEmail}</a>}
              {asset.personPhone && <a href={`tel:${asset.personPhone}`} style={{ color: "#2563EB", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><Phone size={14} />{asset.personPhone}</a>}
              {asset.personLinkedin && <a href={asset.personLinkedin} target="_blank" rel="noreferrer" style={{ color: "#2563EB", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><ExternalLink size={14} />LinkedIn</a>}
              {asset.personNotes && <p style={{ color: C.text, margin: 0, lineHeight: 1.6 }}>{asset.personNotes}</p>}
            </div>
          )}

          {isPerson && editing && (
            <>
              <Field label="Name"><input style={inputStyle} value={form.personName} onChange={u("personName")} /></Field>
              <Field label="Role">
                <select style={selectStyle} value={form.personTitle} onChange={u("personTitle")}>
                  <option value="">— none —</option>
                  {PERSON_TITLES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Email"><input style={inputStyle} value={form.personEmail} onChange={u("personEmail")} /></Field>
                <Field label="Phone"><input style={inputStyle} value={form.personPhone} onChange={u("personPhone")} /></Field>
              </div>
              <Field label="LinkedIn"><input style={inputStyle} value={form.personLinkedin} onChange={u("personLinkedin")} /></Field>
              <Field label="Notes"><textarea style={textareaStyle} value={form.personNotes} onChange={u("personNotes")} /></Field>
            </>
          )}

          {(linkedCompany || linkedJob) && (
            <div style={{ marginBottom: 20, marginTop: !isPerson && !editing && asset.assetUrl ? 24 : undefined }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Attached to</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {linkedCompany && (
                  <div
                    onClick={onNavigateCompany ? () => { onClose(); onNavigateCompany(linkedCompany); } : undefined}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 13, cursor: onNavigateCompany ? "pointer" : "default", transition: "background .15s" }}
                    onMouseEnter={e => { if (onNavigateCompany) (e.currentTarget as HTMLDivElement).style.background = "#DDE2E6"; }}
                    onMouseLeave={e => { if (onNavigateCompany) (e.currentTarget as HTMLDivElement).style.background = C.bg; }}
                  >
                    <CompanyLogo name={linkedCompany.name} size={18} radius={4} /> {linkedCompany.name}
                  </div>
                )}
                {linkedJob && (
                  <div
                    onClick={onNavigateJob ? () => { onClose(); onNavigateJob(linkedJob); } : undefined}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, maxWidth: 340, overflow: "hidden", cursor: onNavigateJob ? "pointer" : "default", transition: "background .15s" }}
                    onMouseEnter={e => { if (onNavigateJob) (e.currentTarget as HTMLDivElement).style.background = "#DDE2E6"; }}
                    onMouseLeave={e => { if (onNavigateJob) (e.currentTarget as HTMLDivElement).style.background = C.bg; }}
                  >
                    <Briefcase size={13} color={C.muted} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{linkedJob.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {editing && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <Field label="Link to job">
                <select style={selectStyle} value={form.jobId} onChange={u("jobId")}>
                  <option value="">— none —</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                </select>
              </Field>
              <Field label="Link to company">
                <select style={selectStyle} value={form.companyId} onChange={u("companyId")}>
                  <option value="">— none —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            {saveError && <p style={{ fontSize: 12, color: "#DC2626", marginBottom: 10, marginTop: 0 }}>{saveError}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {editing ? (
              <>
                <Btn onClick={save} disabled={saving} style={{ padding: "8px 16px", fontSize: 13 }}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : null} Save
                </Btn>
                <Btn variant="ghost" onClick={() => setEditing(false)} style={{ padding: "8px 16px", fontSize: 13 }}>Cancel</Btn>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  {confirmDelete ? (
                    <>
                      <span style={{ fontSize: 13, color: C.muted, alignSelf: "center" }}>Sure?</span>
                      <Btn variant="danger" onClick={del} disabled={deleting} style={{ padding: "8px 14px", fontSize: 13 }}>
                        {deleting ? "…" : "Delete"}
                      </Btn>
                      <Btn variant="ghost" onClick={() => setConfirmDelete(false)} style={{ padding: "8px 14px", fontSize: 13 }}>No</Btn>
                    </>
                  ) : (
                    <Btn variant="danger" onClick={() => setConfirmDelete(true)} style={{ padding: "8px 16px", fontSize: 13 }}>Delete</Btn>
                  )}
                </div>
              </>
            ) : (
              <>
                <Btn variant="ghost" onClick={() => setEditing(true)} style={{ padding: "8px 16px", fontSize: 13 }}>Edit</Btn>
                <div style={{ marginLeft: "auto" }}>
                  <Btn variant="ghost" onClick={onClose} style={{ padding: "8px 16px", fontSize: 13 }}>Close</Btn>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Job Detail Page ────────────────────────────────────────────────────────

function JobDetailPage({ job, companies, jobs, activities, assets, onBack, onStatusChange, onDelete, onJobUpdate, onNavigateCompany, onNavigateJob }: {
  job: Job; companies: Company[]; jobs: Job[]; activities: Activity[]; assets: Asset[];
  onBack: () => void;
  onStatusChange: (id: string, s: JobStatus) => void;
  onDelete: (id: string) => void;
  onJobUpdate: (updated: Job) => void;
  onNavigateCompany?: (c: Company) => void;
  onNavigateJob?: (j: Job) => void;
}) {
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [loadingPanel, setLoadingPanel] = useState(true);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [editHeader, setEditHeader] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [headerName, setHeaderName] = useState(job.name);
  const [headerLocation, setHeaderLocation] = useState(job.location);
  const [notesForm, setNotesForm] = useState(job.notes);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [notesHovered, setNotesHovered] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [hoveredActivityId, setHoveredActivityId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<JobStatus | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingPanel(true);
    if (MOCK_MODE) {
      setMyActivities(activities.filter(a => a.jobId === job.id).sort((a, b) => a.date.localeCompare(b.date)));
      setMyAssets(assets.filter(a => a.jobId === job.id));
      setLoadingPanel(false);
      return;
    }
    Promise.all([
      fetch(`/api/activities?jobId=${job.id}`).then(r => r.json()),
      fetch(`/api/assets?jobId=${job.id}`).then(r => r.json()),
    ]).then(([acts, asts]) => {
      setMyActivities(Array.isArray(acts) ? acts.sort((a: Activity, b: Activity) => a.date.localeCompare(b.date)) : []);
      setMyAssets(Array.isArray(asts) ? asts : []);
    }).finally(() => setLoadingPanel(false));
  }, [job.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveHeader = async () => {
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: headerName, location: headerLocation }),
    });
    onJobUpdate({ ...job, name: headerName, location: headerLocation });
    setEditHeader(false);
  };

  const saveNotes = async () => {
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesForm }),
    });
    onJobUpdate({ ...job, notes: notesForm });
    setEditNotes(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    onDelete(job.id);
    onBack();
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingTop: 32 }}>
      {/* Back */}
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 28, padding: 0 }}>
        <ChevronLeft size={16} /> All jobs
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 32 }}>
        <CompanyLogo name={job.companyName || "?"} logoUrl={job.companyLogoUrl || undefined} size={56} radius={12} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {editHeader ? (
            <div>
              <input
                style={{ ...inputStyle, fontSize: 22, fontFamily: "Georgia, serif", fontWeight: 600, marginBottom: 10 }}
                value={headerName} onChange={e => setHeaderName(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key === "Escape") setEditHeader(false); }}
                placeholder="Job title"
              />
              <input
                style={{ ...inputStyle, fontSize: 14, marginBottom: 10 }}
                value={headerLocation} onChange={e => setHeaderLocation(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveHeader(); if (e.key === "Escape") setEditHeader(false); }}
                placeholder="Location (e.g. San Francisco, CA · Remote)"
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveHeader} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <Check size={14} />
                </button>
                <button onClick={() => { setEditHeader(false); setHeaderName(job.name); setHeaderLocation(job.location); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: C.muted, display: "flex", alignItems: "center" }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)}>
              <h1 style={{ fontSize: 26, fontWeight: 500, fontFamily: "Georgia, 'Times New Roman', serif", color: C.text, lineHeight: 1.2, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
                {job.name}
                <button onClick={() => setEditHeader(true)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2, opacity: headerHovered ? 1 : 0, transition: "opacity .15s", display: "flex" }}>
                  <Pencil size={14} />
                </button>
              </h1>
              <div style={{ fontSize: 15, color: C.muted, marginTop: 6 }}>{job.companyName}</div>
              {job.location && <div style={{ fontSize: 14, color: C.muted, marginTop: 5 }}>{job.location}</div>}
            </div>
          )}
        </div>

        {/* Status dropdown */}
        <div style={{ position: "relative", flexShrink: 0 }} ref={statusRef}>
          <button onClick={() => setStatusDropdown(d => !d)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <StatusBadge status={job.status} chevron />
          </button>
          {statusDropdown && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", borderRadius: 10, border: `1px solid ${C.border}`, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 200, minWidth: 210, padding: 6 }}>
              {JOB_STATUSES.map(s => (
                <button key={s} onClick={() => {
                  setStatusDropdown(false);
                  if (job.archived && s !== "Closed") {
                    setPendingStatus(s);
                  } else {
                    onStatusChange(job.id, s);
                  }
                }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", borderRadius: 6, fontSize: 13, color: C.text }}>
                  {s}
                  {job.status === s && <Check size={13} color={C.green} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unarchive confirmation */}
      {pendingStatus && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 18px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#92400E", fontWeight: 500 }}>Do you want to unarchive this job?</span>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Btn variant="ghost" onClick={() => setPendingStatus(null)} style={{ padding: "6px 14px", fontSize: 13 }}>Cancel</Btn>
            <Btn onClick={async () => {
              const s = pendingStatus;
              setPendingStatus(null);
              await fetch(`/api/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: false, status: s }) });
              onJobUpdate({ ...job, archived: false, status: s });
              onStatusChange(job.id, s);
            }} style={{ padding: "6px 14px", fontSize: 13 }}>Unarchive + apply</Btn>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showConfirmDelete && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 18px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: C.red, fontWeight: 500 }}>Delete this job permanently?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setShowConfirmDelete(false)} style={{ padding: "6px 14px", fontSize: 13 }}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={deleting} style={{ padding: "6px 14px", fontSize: 13 }}>
              {deleting ? "Deleting…" : "Delete"}
            </Btn>
          </div>
        </div>
      )}

      {/* Notes */}
      {(job.notes || editNotes) && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <SectionLabel>Notes</SectionLabel>
            {!editNotes && (
              <button onClick={() => { setEditNotes(true); setNotesForm(job.notes); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2, display: "flex" }}>
                <Pencil size={13} />
              </button>
            )}
          </div>
          {editNotes ? (
            <div>
              <textarea style={{ ...textareaStyle, minHeight: 100 }} value={notesForm} onChange={e => setNotesForm(e.target.value)} autoFocus />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Btn onClick={saveNotes} style={{ padding: "7px 14px", fontSize: 13 }}>Save</Btn>
                <Btn variant="ghost" onClick={() => setEditNotes(false)} style={{ padding: "7px 14px", fontSize: 13 }}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <div
              onMouseEnter={() => setNotesHovered(true)}
              onMouseLeave={() => setNotesHovered(false)}
              onClick={() => setEditNotes(true)}
              style={{ fontSize: 14, color: C.text, lineHeight: 1.7, cursor: "text" }}>
              {job.notes}
            </div>
          )}
        </div>
      )}

      {/* Assets */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 20 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <SectionLabel>Assets</SectionLabel>
          <button onClick={() => setShowAddAsset(true)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.muted, fontWeight: 500 }}>
            <Plus size={13} /> Add asset
          </button>
        </div>
        {loadingPanel ? null : myAssets.length === 0 ? (
          <div style={{ fontSize: 13, color: C.muted }}>No assets yet.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {myAssets.map(a => {
              const AIcon = ASSET_ICONS[a.type];
              const rawLabel = a.type === "Contact" ? (a.personName || a.label) : a.label;
              const label = (a.type === "Gmail link" && rawLabel.startsWith("http")) ? "Gmail thread" : rawLabel;
              return (
                <button key={a.id} onClick={() => setEditingAsset(a)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 13, cursor: "pointer", color: C.text, maxWidth: 320, overflow: "hidden" }}>
                  <AIcon size={13} color={ASSET_COLORS[a.type]} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 20 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <SectionLabel>Activity</SectionLabel>
          <button onClick={() => setShowAddActivity(true)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.muted, fontWeight: 500 }}>
            <Plus size={13} /> Add activity
          </button>
        </div>
        {loadingPanel ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.muted, fontSize: 14 }}>
            <Loader2 size={15} className="animate-spin" /> Loading…
          </div>
        ) : myActivities.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 14 }}>No activity logged yet.</div>
        ) : (
          <div>
            {myActivities.map((a, i) => {
              const AIcon = ACTIVITY_ICONS[a.type] || MessageSquare;
              const color = ACTIVITY_COLORS[a.type];
              return (
                <div key={a.id}
                  onMouseEnter={() => setHoveredActivityId(a.id)}
                  onMouseLeave={() => setHoveredActivityId(null)}
                  style={{ display: "flex", gap: 14, marginBottom: 24, position: "relative" }}>
                  {i < myActivities.length - 1 && (
                    <div style={{ position: "absolute", left: 17, top: 36, bottom: -24, width: 1, background: "#A8A29E" }} />
                  )}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                    <AIcon size={15} color={color} />
                  </div>
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 400, color: C.text }}>{a.type}</span>
                        <button onClick={() => setEditingActivity(a)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: C.muted, display: "flex", opacity: hoveredActivityId === a.id ? 1 : 0, transition: "opacity .15s" }}>
                          <Pencil size={13} />
                        </button>
                      </div>
                      <span style={{ fontSize: 12, color: C.muted }}>{formatDate(a.date)}</span>
                    </div>
                    {a.notes && (
                      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
                        <NotesWithMentions notes={a.notes} allAssets={[...myAssets, ...assets.filter(ast => ast.companyId === job.companyId && !myAssets.find(m => m.id === ast.id))]} onOpenAsset={setEditingAsset} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Archive + Delete */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: "flex", alignItems: "center", gap: 20 }}>
        {job.archived ? (
          <button onClick={async () => { await fetch(`/api/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: false }) }); onJobUpdate({ ...job, archived: false }); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Archive size={13} /> Unarchive job
          </button>
        ) : (
          <button onClick={async () => { await fetch(`/api/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: true }) }); onJobUpdate({ ...job, archived: true }); onBack(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Archive size={13} /> Archive job
          </button>
        )}
        <button onClick={() => setShowConfirmDelete(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Trash2 size={13} /> Delete job
        </button>
      </div>

      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={updated => setMyActivities(acts => acts.map(a => a.id === updated.id ? updated : a))}
          onDelete={id => setMyActivities(acts => acts.filter(a => a.id !== id))}
          assets={[...myAssets, ...assets.filter(ast => ast.companyId === job.companyId && !myAssets.find(m => m.id === ast.id))]}
        />
      )}

      {/* Toast */}
      {statusToast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: C.text, color: "#fff", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", whiteSpace: "nowrap" }}>
          Status updated to {statusToast}
        </div>
      )}

      {showAddActivity && (
        <AddActivityModal
          jobId={job.id} jobName={job.name}
          assets={[...myAssets, ...assets.filter(ast => ast.companyId === job.companyId && !myAssets.find(m => m.id === ast.id))]}
          onClose={() => setShowAddActivity(false)}
          onSave={async a => {
            setMyActivities(acts => [a, ...acts].sort((x, y) => x.date.localeCompare(y.date)));
            setShowAddActivity(false);
            const newStatus = deriveStatusChange(a.type, job.status);
            if (newStatus) {
              await fetch(`/api/jobs/${job.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
              });
              onStatusChange(job.id, newStatus);
              setStatusToast(newStatus);
              setTimeout(() => setStatusToast(null), 2000);
            }
          }}
        />
      )}
      {showAddAsset && (
        <AddAssetModal
          companies={companies} jobs={jobs} linkTo={{ jobId: job.id }}
          onClose={() => setShowAddAsset(false)}
          onSave={a => { setMyAssets(asts => [a, ...asts]); setShowAddAsset(false); }}
        />
      )}
      {editingAsset && (
        <EditAssetModal
          asset={editingAsset} companies={companies} jobs={jobs}
          onClose={() => setEditingAsset(null)}
          onSave={updated => { setMyAssets(asts => asts.map(a => a.id === updated.id ? updated : a)); setEditingAsset(null); }}
          onDelete={id => { setMyAssets(asts => asts.filter(a => a.id !== id)); setEditingAsset(null); }}
          onNavigateCompany={onNavigateCompany}
          onNavigateJob={onNavigateJob}
        />
      )}
    </div>
  );
}

// ── Jobs View ──────────────────────────────────────────────────────────────

function JobsView({ jobs, activities, onSelect }: {
  jobs: Job[]; activities: Activity[];
  onSelect: (j: Job) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<JobStatus | "All">("All");
  const [archivedOpen, setArchivedOpen] = useState(false);
  const isMobile = useIsMobile();

  const activeJobs = jobs.filter(j => !j.archived);
  const archivedJobs = jobs.filter(j => j.archived);

  const filtered = activeJobs.filter(j => {
    const q = search.toLowerCase();
    if (q && !j.name.toLowerCase().includes(q) && !j.companyName.toLowerCase().includes(q)) return false;
    if (filter !== "All" && j.status !== filter) return false;
    return true;
  });

  const lastActivity: Record<string, string> = {};
  const jobCreatedDate: Record<string, string> = {};
  activities.forEach(a => {
    if (!lastActivity[a.jobId] || a.date > lastActivity[a.jobId]) lastActivity[a.jobId] = a.date;
    if (a.type === "Job created") jobCreatedDate[a.jobId] = a.date;
  });

  const FILTERS: (JobStatus | "All")[] = ["All", "Want to apply", "Applied (no response)", "Applied (referred)", "In progress", "Closed"];

  return (
    <div style={{ maxWidth: isMobile ? "100%" : 760, margin: "0 auto" }}>
      {/* Search + filter pills row */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-start", gap: 10, marginBottom: 20 }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input style={{ ...inputStyle, paddingLeft: 34, width: "100%" }} placeholder="Search jobs…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center", overflowX: isMobile ? "auto" : "visible", flexWrap: isMobile ? "nowrap" : "wrap", paddingBottom: isMobile ? 2 : 0, minWidth: 0, width: isMobile ? "100%" : undefined }}>
          {FILTERS.map(f => {
            const count = f === "All" ? activeJobs.length : activeJobs.filter(j => j.status === f).length;
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{ borderRadius: 20, padding: "6px 13px", fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1.5px solid rgba(23,23,26,0.18)", background: active ? "#1C3830" : "transparent", color: active ? "#fff" : "#7A776F", whiteSpace: "nowrap" as const, fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", flexShrink: 0 }}>
                {f} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: C.muted, fontSize: 14 }}>
          {jobs.length === 0 ? "No jobs yet. Add your first one." : "No matches."}
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map(j => (
          <div key={j.id} onClick={() => onSelect(j)}
            style={{ background: "#fff", borderRadius: 12, padding: isMobile ? "12px 16px" : "22px 20px", cursor: "pointer", border: `1px solid ${C.border}`, borderLeft: `3px solid ${STATUS_BORDER[j.status]}`, transition: "box-shadow .15s", display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 16, minWidth: 0, overflow: "hidden" }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 14px rgba(0,0,0,0.07)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
            <CompanyLogo name={j.companyName || "?"} logoUrl={j.companyLogoUrl || undefined} size={40} radius={10} />
            {isMobile ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.name}</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.companyName}{j.location ? ` · ${j.location}` : ""}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <StatusBadge status={j.status} />
                  {(() => { const d = lastActivity[j.id] || jobCreatedDate[j.id]; const fmt = d ? formatDate(d) : ""; return fmt ? <span style={{ fontSize: 11, color: C.muted }}>{fmt}</span> : null; })()}
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>{j.name}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{j.companyName}{j.location ? ` · ${j.location}` : ""}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 9, flexShrink: 0 }}>
                  <StatusBadge status={j.status} />
                  {(() => { const d = lastActivity[j.id] || jobCreatedDate[j.id]; const fmt = d ? formatDate(d) : ""; return fmt ? <span style={{ fontSize: 11, color: C.muted }}>{fmt}</span> : null; })()}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Archived disclosure */}
      {archivedJobs.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setArchivedOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: C.muted, fontSize: 13, padding: "6px 0" }}>
            {archivedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Archived · {archivedJobs.length}
          </button>
          {archivedOpen && (
            <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
              {archivedJobs.filter(j => {
                const q = search.toLowerCase();
                return !q || j.name.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q);
              }).map(j => (
                <div key={j.id} onClick={() => onSelect(j)}
                  style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", cursor: "pointer", border: `1px solid ${C.border}`, borderLeft: `3px solid ${STATUS_BORDER[j.status] ?? "#D1D5DB"}`, display: "flex", alignItems: "center", gap: 16, opacity: 0.55, transition: "box-shadow .15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 14px rgba(0,0,0,0.07)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
                  <CompanyLogo name={j.companyName || "?"} logoUrl={j.companyLogoUrl || undefined} size={40} radius={10} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Georgia, 'Times New Roman', serif", color: C.text }}>{j.name}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>{j.companyName}{j.location ? ` · ${j.location}` : ""}</div>
                  </div>
                  <StatusBadge status={j.status} archived />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Company Detail Page ────────────────────────────────────────────────────

function CompanyDetailPage({ company, jobs, onBack, onUpdate, onDelete, onSelectJob }: {
  company: Company; jobs: Job[];
  onBack: () => void;
  onUpdate: (updated: Company) => void;
  onDelete: (id: string) => void;
  onSelectJob: (j: Job) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameForm, setNameForm] = useState(company.name);
  const [logoUrlForm, setLogoUrlForm] = useState(company.logoUrl);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nameHovered, setNameHovered] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);

  const companyJobs = jobs.filter(j => j.companyId === company.id);

  const saveName = async () => {
    if (logoUrlForm.length > 2000) {
      alert(`Logo URL is too long (${logoUrlForm.length} chars). Notion has a 2000-character limit. Please use a shorter URL — upload the image to imgur.com or similar and paste that link instead.`);
      return;
    }
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: nameForm, logoUrl: logoUrlForm }),
    });
    const data = await res.json();
    if (data.error) { alert(`Save failed: ${data.error}`); return; }
    onUpdate({ ...company, name: nameForm, logoUrl: logoUrlForm });
    setEditingName(false);
  };

  const del = async () => {
    setDeleting(true);
    await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
    onDelete(company.id);
    onBack();
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingTop: 32 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 28, padding: 0 }}>
        <ChevronLeft size={16} /> All companies
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
        <CompanyLogo name={company.name} logoUrl={company.logoUrl || undefined} size={56} radius={12} />
        <div style={{ flex: 1 }}>
          {editingName ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={{ ...inputStyle, fontSize: 22, fontFamily: "Georgia, serif", fontWeight: 600 }} value={nameForm} onChange={e => setNameForm(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Escape") setEditingName(false); }} placeholder="Company name" />
              <input style={inputStyle} value={logoUrlForm} onChange={e => setLogoUrlForm(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }} placeholder="Logo URL (optional — leave blank to use Clearbit)" />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveName} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex" }}><Check size={14} /></button>
                <button onClick={() => setEditingName(false)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: C.muted, display: "flex" }}><X size={14} /></button>
              </div>
            </div>
          ) : (
            <h1
              onMouseEnter={() => setNameHovered(true)}
              onMouseLeave={() => setNameHovered(false)}
              style={{ fontSize: 26, fontWeight: 600, fontFamily: "Georgia, 'Times New Roman', serif", color: C.text, display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
              {company.name}
              <button onClick={() => setEditingName(true)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2, opacity: nameHovered ? 1 : 0, transition: "opacity .15s", display: "flex" }}>
                <Pencil size={14} />
              </button>
            </h1>
          )}
        </div>
      </div>

      {/* Tracked Jobs */}
      <div style={{ marginBottom: 36 }}>
        <SectionLabel>Jobs{companyJobs.length > 0 ? ` (${companyJobs.length})` : ""}</SectionLabel>
        {companyJobs.length === 0 ? (
          <div style={{ fontSize: 13, color: C.muted }}>No jobs tracked for this company.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {companyJobs.map(j => (
              <div key={j.id} onClick={() => onSelectJob(j)}
                style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "box-shadow .15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{j.name}</div>
                  {j.location && <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{j.location}</div>}
                </div>
                <StatusBadge status={j.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 16 }}>
          <SectionLabel>Links</SectionLabel>
          <button onClick={() => setShowAddLink(true)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.muted, fontWeight: 500 }}>
            <Plus size={13} /> Add link
          </button>
        </div>
        {company.links.length === 0 ? (
          <div style={{ fontSize: 13, color: C.muted }}>No links yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {company.links.map((lnk, i) => (
              <a key={i} href={lnk.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.border}`, textDecoration: "none", transition: "box-shadow .15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none"}>
                <Globe size={16} color={C.muted} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{lnk.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", marginTop: 6 }}>{lnk.url}</div>
                </div>
                <span style={{ fontSize: 11, background: C.border, color: C.muted, borderRadius: 6, padding: "3px 8px", flexShrink: 0, fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}>{lnk.type.toLowerCase().replace(" site", "")}</span>
              </a>
            ))}
          </div>
        )}
        {showAddLink && (
          <AddLinkModal
            onClose={() => setShowAddLink(false)}
            onSave={async (lnk) => {
              const updated = { ...company, links: [...company.links, lnk] };
              await fetch(`/api/companies/${company.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ links: updated.links }),
              });
              onUpdate(updated);
              setShowAddLink(false);
            }}
          />
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
        {confirmDelete ? (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: C.red }}>Delete company (jobs will remain)?</span>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => setConfirmDelete(false)} style={{ padding: "6px 12px", fontSize: 13 }}>Cancel</Btn>
              <Btn variant="danger" onClick={del} disabled={deleting} style={{ padding: "6px 12px", fontSize: 13 }}>
                {deleting ? "Deleting…" : "Delete"}
              </Btn>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Trash2 size={13} /> Delete company
          </button>
        )}
      </div>
    </div>
  );
}

// ── Companies View ─────────────────────────────────────────────────────────

function CompaniesView({ companies, jobs, onSelect }: {
  companies: Company[]; jobs: Job[];
  onSelect: (c: Company) => void;
}) {
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();

  const withCount = companies
    .map(c => ({ c, openCount: jobs.filter(j => j.companyId === c.id && !j.archived && j.status !== "Closed").length }))
    .filter(({ c }) => c.name.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...withCount].sort((a, b) => {
    if (a.openCount === 0 && b.openCount > 0) return 1;
    if (b.openCount === 0 && a.openCount > 0) return -1;
    if (b.openCount !== a.openCount) return b.openCount - a.openCount;
    return a.c.name.localeCompare(b.c.name);
  });

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 280 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
        <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Search companies…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {sorted.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: C.muted, fontSize: 14 }}>
          {companies.length === 0 ? "No companies yet. Add your first one." : "No matches."}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
        {sorted.map(({ c, openCount }) => {
          const openLabel = openCount === 0 ? "No open jobs" : openCount === 1 ? "1 open job" : `${openCount} open jobs`;
          return (
            <div key={c.id} onClick={() => onSelect(c)}
              style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", cursor: "pointer", border: `1px solid ${C.border}`, transition: "box-shadow .15s", display: "flex", alignItems: "center", gap: 14 }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 14px rgba(0,0,0,0.07)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
              <CompanyLogo name={c.name} logoUrl={c.logoUrl || undefined} size={40} radius={10} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{openLabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Assets View ────────────────────────────────────────────────────────────

const ASSET_TYPE_LABELS: Record<string, string> = {
  "All": "All",
  "URL": "URL",
  "Gmail link": "Gmail",
  "Document": "Document",
  "Contact": "Contact",
};

function AssetsView({ assets, companies, jobs, onUpdate, onDelete, onNavigateCompany, onNavigateJob }: {
  assets: Asset[]; companies: Company[]; jobs: Job[];
  onUpdate: (updated: Asset) => void;
  onDelete: (id: string) => void;
  onNavigateCompany?: (c: Company) => void;
  onNavigateJob?: (j: Job) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<AssetType | "All">("All");
  const [companyFilter, setCompanyFilter] = useState("");
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const isMobile = useIsMobile();

  const filtered = assets.filter(a => {
    if (typeFilter !== "All" && a.type !== typeFilter) return false;
    if (companyFilter) {
      const linkedJob = jobs.find(j => j.id === a.jobId);
      const linkedCompanyId = a.companyId || linkedJob?.companyId;
      if (linkedCompanyId !== companyFilter) return false;
    }
    return true;
  });

  const companiesInAssets = companies.filter(c =>
    assets.some(a => {
      const linkedJob = jobs.find(j => j.id === a.jobId);
      return a.companyId === c.id || linkedJob?.companyId === c.id;
    })
  );

  return (
    <div style={{ maxWidth: isMobile ? "100%" : 760, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: 10, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, overflowX: isMobile ? "auto" : "visible", flexWrap: isMobile ? "nowrap" : "wrap", paddingBottom: isMobile ? 2 : 0 }}>
          {(["All", "URL", "Gmail link", "Document", "Contact"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t as any)}
              style={{ borderRadius: 20, padding: "7px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1.5px solid rgba(23,23,26,0.18)", background: typeFilter === t ? "#1C3830" : "transparent", color: typeFilter === t ? "#fff" : "#7A776F", transition: "all .1s", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", flexShrink: 0, whiteSpace: "nowrap" as const }}>
              {ASSET_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
            style={{ ...selectStyle, paddingRight: 32, minWidth: isMobile ? "100%" : 160, appearance: "none", WebkitAppearance: "none", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", color: "#7A776F", fontSize: 12 }}>
            <option value="">All companies</option>
            {companiesInAssets.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: C.muted }} />
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: C.muted, fontSize: 14 }}>
          {assets.length === 0 ? "No assets yet. Save links, contacts, and docs here." : "No matches."}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 8 }}>
        {filtered.map(a => {
          const AIcon = ASSET_ICONS[a.type];
          const isPerson = a.type === "Contact";
          const isGmail = a.type === "Gmail link";
          const rawLabel = isPerson ? (a.personName || a.label) : a.label;
          const displayLabel = isGmail ? (rawLabel.startsWith("http") || rawLabel === "Gmail" ? "Gmail thread" : rawLabel) : rawLabel;
          const linkedJob = jobs.find(j => j.id === a.jobId);
          const linkedCompany = companies.find(c => c.id === a.companyId) || (linkedJob ? companies.find(c => c.id === linkedJob.companyId) : undefined);
          return (
            <div key={a.id} onClick={() => setEditingAsset(a)}
              style={{ background: "#fff", borderRadius: 10, padding: "14px 16px 14px", border: `1px solid ${C.border}`, cursor: "pointer", transition: "box-shadow .15s", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", minWidth: 0 }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 14px rgba(0,0,0,0.07)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
                <div style={{ background: ASSET_BG[a.type], color: ASSET_COLORS[a.type], padding: 7, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AIcon size={14} />
                </div>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}>{ASSET_TYPE_LABELS[a.type]}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{displayLabel}</div>
              {linkedCompany && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: "auto" }}>
                  <CompanyLogo name={linkedCompany.name} logoUrl={linkedCompany.logoUrl || undefined} size={16} radius={3} noBorder />
                  <span style={{ fontSize: 11, color: C.muted }}>{linkedCompany.name}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingAsset && (
        <EditAssetModal
          asset={editingAsset} companies={companies} jobs={jobs}
          onClose={() => setEditingAsset(null)}
          onSave={updated => { onUpdate(updated); setEditingAsset(null); }}
          onDelete={id => { onDelete(id); setEditingAsset(null); }}
          onNavigateCompany={onNavigateCompany}
          onNavigateJob={onNavigateJob}
        />
      )}
    </div>
  );
}

// ── Mock mode ─────────────────────────────────────────────────────────────

const MOCK_MODE = false;

const MOCK_COMPANIES: Company[] = [
  { id: "c1", name: "Figma", notes: "", logoUrl: "", links: [], url: "" },
  { id: "c2", name: "Stripe", notes: "", logoUrl: "", links: [], url: "" },
  { id: "c3", name: "Apple", notes: "", logoUrl: "", links: [], url: "" },
];

const MOCK_JOBS: Job[] = [
  { id: "j1", name: "Staff Product Designer", companyId: "c1", companyName: "Figma", companyLogoUrl: "", status: "In progress", archived: false, notes: "Referred by Jordan K.", location: "San Francisco, CA", createdAt: "2026-05-10T00:00:00Z", url: "" },
  { id: "j2", name: "Senior UX Designer, Payments", companyId: "c2", companyName: "Stripe", companyLogoUrl: "", status: "Applied (no response)", archived: false, notes: "", location: "Remote", createdAt: "2026-05-20T00:00:00Z", url: "" },
  { id: "j3", name: "Principal Designer, HI", companyId: "c3", companyName: "Apple", companyLogoUrl: "", status: "Want to apply", archived: false, notes: "", location: "Cupertino, CA", createdAt: "2026-06-01T00:00:00Z", url: "" },
  { id: "j4", name: "Design Lead, Growth", companyId: "c1", companyName: "Figma", companyLogoUrl: "", status: "Closed", archived: false, notes: "Position filled.", location: "San Francisco, CA", createdAt: "2026-04-15T00:00:00Z", url: "" },
];

const MOCK_ACTIVITIES: Activity[] = [
  { id: "ac1", type: "Job created", date: "2026-05-10", notes: "", jobId: "j1", jobName: "Staff Product Designer", url: "" },
  { id: "ac2", type: "Job created", date: "2026-05-20", notes: "", jobId: "j2", jobName: "Senior UX Designer, Payments", url: "" },
  { id: "ac3", type: "Job created", date: "2026-06-01", notes: "", jobId: "j3", jobName: "Principal Designer, HI", url: "" },
  { id: "ac4", type: "Job created", date: "2026-04-15", notes: "", jobId: "j4", jobName: "Design Lead, Growth", url: "" },
  { id: "a1", type: "Interview", date: "2026-06-05", notes: "First round with hiring manager.", jobId: "j1", jobName: "Staff Product Designer", url: "" },
  { id: "a2", type: "Application submitted", date: "2026-05-21", notes: "", jobId: "j2", jobName: "Senior UX Designer, Payments", url: "" },
  { id: "a3", type: "Note", date: "2026-06-10", notes: "Need to follow up on portfolio review.", jobId: "j1", jobName: "Staff Product Designer", url: "" },
];

const MOCK_ASSETS: Asset[] = [
  { id: "ast1", type: "URL", label: "Figma — Staff Designer JD", assetUrl: "https://figma.com/careers", personName: "", personTitle: "", personEmail: "", personPhone: "", personLinkedin: "", personNotes: "", companyId: "c1", jobId: "j1", activityId: "", url: "" },
  { id: "ast2", type: "Gmail link", label: "Thread: Jordan Kessler · Figma", assetUrl: "https://mail.google.com/mail/u/0/#inbox/mock", personName: "", personTitle: "", personEmail: "", personPhone: "", personLinkedin: "", personNotes: "", companyId: "c1", jobId: "j1", activityId: "", url: "" },
  { id: "ast3", type: "Contact", label: "Jordan Kessler", assetUrl: "", personName: "Jordan Kessler", personTitle: "Recruiter", personEmail: "jordan@figma.com", personPhone: "", personLinkedin: "", personNotes: "Main point of contact.", companyId: "c1", jobId: "j1", activityId: "", url: "" },
  { id: "ast4", type: "URL", label: "Stripe — Senior UX JD", assetUrl: "https://stripe.com/jobs", personName: "", personTitle: "", personEmail: "", personPhone: "", personLinkedin: "", personNotes: "", companyId: "c2", jobId: "j2", activityId: "", url: "" },
  { id: "ast5", type: "Document", label: "Portfolio — Case Studies", assetUrl: "https://drive.google.com/file/d/mock123/view", personName: "", personTitle: "", personEmail: "", personPhone: "", personLinkedin: "", personNotes: "", companyId: "c1", jobId: "j1", activityId: "", url: "" },
];

// ── Main App ───────────────────────────────────────────────────────────────

type View = "jobs" | "companies" | "assets";

const NAV_VIEWS: View[] = ["jobs", "companies", "assets"];

function NavTabs({ view, navTo }: { view: View; navTo: (v: View) => void }) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const idx = NAV_VIEWS.indexOf(view);
    const el = tabRefs.current[idx];
    if (!el) return;
    const parent = el.parentElement!;
    const parentRect = parent.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setPill({ left: rect.left - parentRect.left, width: rect.width });
    setReady(true);
  }, [view]);

  useEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div style={{ position: "relative", display: "flex", gap: 2, flex: 1 }}>
      {/* sliding pill */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, borderRadius: 8,
        background: "rgba(28,56,48,0.09)",
        left: pill.left, width: pill.width,
        transition: ready ? "left 200ms ease-out, width 200ms ease-out" : "none",
        pointerEvents: "none",
      }} />
      {NAV_VIEWS.map((v, i) => (
        <button
          key={v}
          ref={el => { tabRefs.current[i] = el; }}
          onClick={() => navTo(v)}
          style={{
            position: "relative", zIndex: 1,
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent",
            color: view === v ? "#1C3830" : "#7A776F",
            fontSize: 14, fontWeight: 500,
            transition: "color 200ms ease-out",
            textTransform: "capitalize",
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [view, setView] = useState<View>("jobs");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = p.get("view") as View | null;
    if (v) setView(v);
    const job = p.get("job"); if (job) setPendingJobId(job);
    const company = p.get("company"); if (company) setPendingCompanyId(company);
  }, []);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    if (MOCK_MODE) {
      setCompanies(MOCK_COMPANIES);
      setJobs(MOCK_JOBS);
      setActivities(MOCK_ACTIVITIES);
      setAssets(MOCK_ASSETS);
      setLoading(false);
      return;
    }
    try {
      const [c, j, a, ast] = await Promise.all([
        fetch("/api/companies").then(r => r.json()),
        fetch("/api/jobs").then(r => r.json()),
        fetch("/api/activities").then(r => r.json()),
        fetch("/api/assets").then(r => r.json()),
      ]);
      if (c.error || j.error || a.error || ast.error) {
        setError(c.error || j.error || a.error || ast.error);
        return;
      }
      const compMap: Record<string, string> = {};
      const compLogoMap: Record<string, string> = {};
      (c as Company[]).forEach(co => { compMap[co.id] = co.name; compLogoMap[co.id] = co.logoUrl || ""; });
      const enrichedJobs = (j as Job[]).map(jo => ({ ...jo, companyName: compMap[jo.companyId] || "", companyLogoUrl: compLogoMap[jo.companyId] || "" }));
      const jobMap: Record<string, string> = {};
      enrichedJobs.forEach(jo => { jobMap[jo.id] = jo.name; });
      const enrichedActivities = (a as Activity[]).map(act => ({ ...act, jobName: jobMap[act.jobId] || "" }));
      setCompanies(c);
      setJobs(enrichedJobs);
      setActivities(enrichedActivities);
      setAssets(ast);
      if (pendingJobId) { const j = enrichedJobs.find((j: Job) => j.id === pendingJobId); if (j) setSelectedJob(j); setPendingJobId(null); }
      if (pendingCompanyId) { const co = (c as Company[]).find((co: Company) => co.id === pendingCompanyId); if (co) setSelectedCompany(co); setPendingCompanyId(null); }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateJobStatus = async (id: string, status: JobStatus) => {
    await fetch(`/api/jobs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setJobs(js => js.map(j => j.id === id ? { ...j, status } : j));
    setSelectedJob(sj => sj?.id === id ? { ...sj, status } : sj);
  };

  const updateUrl = (v: View, jobId?: string, companyId?: string) => {
    const p = new URLSearchParams();
    p.set("view", v);
    if (jobId) p.set("job", jobId);
    if (companyId) p.set("company", companyId);
    window.history.replaceState(null, "", "?" + p.toString());
  };

  const navTo = (v: View) => { setView(v); setSelectedJob(null); setSelectedCompany(null); updateUrl(v); };

  useEffect(() => { updateUrl(view, selectedJob?.id, selectedCompany?.id); }, [view, selectedJob?.id, selectedCompany?.id]);

  const newBtnLabel = view === "jobs" ? "New job" : view === "companies" ? "New company" : "New asset";
  const newBtnAction = () => {
    if (view === "jobs") setShowAddJob(true);
    else if (view === "companies") setShowAddCompany(true);
    else setShowAddAsset(true);
  };

  const MOBILE_TABS: { view: View; label: string; Icon: any }[] = [
    { view: "jobs", label: "Jobs", Icon: Briefcase },
    { view: "companies", label: "Companies", Icon: Building2 },
    { view: "assets", label: "Assets", Icon: Paperclip },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text }}>
      {/* Desktop top nav — hidden on mobile */}
      {!isMobile && (
        <nav style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 800, padding: "0 32px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 28 }}>
              <svg width="28" height="28" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><circle cx="256" cy="256" r="256" fill="#1C3830"/><g transform="translate(256 256)"><g transform="translate(-120 -120) scale(10)" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></g></g></svg>
              <span style={{ fontFamily: "var(--font-dm-serif), Georgia, serif", fontSize: 21, fontWeight: 400, color: C.text, letterSpacing: -0.5 }}>Job Tracker</span>
            </div>
            <NavTabs view={view} navTo={navTo} />
            <Btn onClick={newBtnAction} style={{ padding: "7px 16px", fontSize: 13 }}>
              <Plus size={14} /> {newBtnLabel}
            </Btn>
          </div>
        </nav>
      )}

      {/* Mobile top bar — shown on mobile only */}
      {isMobile && (
        <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 800, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="28" height="28" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><circle cx="256" cy="256" r="256" fill="#1C3830"/><g transform="translate(256 256)"><g transform="translate(-120 -120) scale(10)" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></g></g></svg>
            <span style={{ fontFamily: "var(--font-dm-serif), Georgia, serif", fontSize: 22, fontWeight: 400, color: C.text, letterSpacing: -0.5 }}>Job Tracker</span>
          </div>
          <button onClick={newBtnAction} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Plus size={14} /> {newBtnLabel}
          </button>
        </div>
      )}

      {/* Main */}
      <main style={{ padding: isMobile ? "20px 16px" : "28px 32px", paddingBottom: isMobile ? `calc(72px + env(safe-area-inset-bottom, 16px))` : "28px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: C.muted }}>
            <Loader2 size={22} className="animate-spin" /> Loading from Notion…
          </div>
        )}
        {error && (
          <div style={{ maxWidth: 600, margin: "60px auto", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 20, display: "flex", gap: 12 }}>
            <AlertCircle size={20} color={C.red} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: C.red }}>Connection error</div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{error}</div>
            </div>
          </div>
        )}
        {!loading && !error && (
          <>
            {view === "jobs" && !selectedJob && (
              <JobsView jobs={jobs} activities={activities} onSelect={setSelectedJob} />
            )}
            {view === "jobs" && selectedJob && (
              <JobDetailPage
                job={selectedJob} companies={companies} jobs={jobs} activities={activities} assets={assets}
                onBack={() => setSelectedJob(null)}
                onStatusChange={updateJobStatus}
                onDelete={id => { setJobs(js => js.filter(j => j.id !== id)); }}
                onJobUpdate={updated => { setJobs(js => js.map(j => j.id === updated.id ? updated : j)); setSelectedJob(updated); }}
                onNavigateCompany={c => { setView("companies"); setSelectedCompany(c); setSelectedJob(null); }}
                onNavigateJob={j => { setSelectedJob(j); }}
              />
            )}
            {view === "companies" && !selectedCompany && (
              <CompaniesView companies={companies} jobs={jobs} onSelect={setSelectedCompany} />
            )}
            {view === "companies" && selectedCompany && (
              <CompanyDetailPage
                company={selectedCompany} jobs={jobs}
                onBack={() => setSelectedCompany(null)}
                onUpdate={updated => { setCompanies(cs => cs.map(c => c.id === updated.id ? updated : c)); setSelectedCompany(updated); }}
                onDelete={id => { setCompanies(cs => cs.filter(c => c.id !== id)); setSelectedCompany(null); }}
                onSelectJob={j => { setView("jobs"); setSelectedJob(j); }}
              />
            )}
            {view === "assets" && (
              <AssetsView
                assets={assets} companies={companies} jobs={jobs}
                onUpdate={updated => setAssets(asts => asts.map(a => a.id === updated.id ? updated : a))}
                onDelete={id => setAssets(asts => asts.filter(a => a.id !== id))}
                onNavigateCompany={c => { setView("companies"); setSelectedCompany(c); }}
                onNavigateJob={j => { setView("jobs"); setSelectedJob(j); }}
              />
            )}
          </>
        )}
      </main>

      {showAddCompany && (
        <AddCompanyModal
          onClose={() => setShowAddCompany(false)}
          onSave={c => { setCompanies(cs => [...cs, c].sort((a, b) => a.name.localeCompare(b.name))); setShowAddCompany(false); }}
        />
      )}
      {showAddJob && (
        <AddJobModal
          companies={companies}
          onClose={() => setShowAddJob(false)}
          onSave={(j, newCompany, newAsset, createdActivity) => {
            setJobs(js => [j, ...js]);
            if (newCompany) setCompanies(cs => [...cs, newCompany].sort((a, b) => a.name.localeCompare(b.name)));
            if (newAsset) setAssets(asts => [newAsset, ...asts]);
            if (createdActivity) setActivities(acts => [createdActivity, ...acts]);
            setShowAddJob(false);
          }}
        />
      )}
      {showAddAsset && (
        <AddAssetModal
          companies={companies} jobs={jobs}
          onClose={() => setShowAddAsset(false)}
          onSave={a => { setAssets(ast => [a, ...ast]); setShowAddAsset(false); }}
        />
      )}

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900, background: "#fff", borderTop: `1px solid ${C.border}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {MOBILE_TABS.map(({ view: v, label, Icon }) => {
            const active = view === v;
            return (
              <button key={v} onClick={() => navTo(v)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 0", background: "none", border: "none", cursor: "pointer", color: active ? "#1B3A2F" : "#9CA3AF" }}>
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: 0.2 }}>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
