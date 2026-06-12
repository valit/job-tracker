"use client";
import { useState, useEffect, useCallback } from "react";
import type { Company, Contact, Activity, Status, Priority, ActivityType, Relationship } from "@/lib/notion";
import {
  LayoutDashboard, Briefcase, Users, Activity as ActivityIcon,
  Plus, X, ExternalLink, ChevronRight, Search, Loader2,
  Mail, Phone, Video, FileText, MessageSquare, Star, ArrowUpRight,
  Trash2, Edit2, Check, AlertCircle
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<Status, string> = {
  Researching: "#9CA3AF",
  Applied: "#3B82F6",
  Interviewing: "#F59E0B",
  Offer: "#10B981",
  Rejected: "#EF4444",
  Closed: "#6B7280",
};

const ACTIVITY_ICONS: Record<ActivityType, any> = {
  "Email sent": Mail,
  "Email received": Mail,
  "Phone call": Phone,
  "Video call": Video,
  "Application submitted": FileText,
  "Interview": Star,
  "Referral": ArrowUpRight,
  "Note": MessageSquare,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  "Email sent": "#3B82F6",
  "Email received": "#8B5CF6",
  "Phone call": "#F59E0B",
  "Video call": "#06B6D4",
  "Application submitted": "#10B981",
  "Interview": "#E94560",
  "Referral": "#F97316",
  "Note": "#9CA3AF",
};

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// ── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  return (
    <span style={{
      background: STATUS_COLORS[status] + "20",
      color: STATUS_COLORS[status],
      border: `1px solid ${STATUS_COLORS[status]}40`,
      borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap"
    }}>{status}</span>
  );
}

function PriorityDot({ priority }: { priority: Priority }) {
  const c = priority === "High" ? "#EF4444" : priority === "Medium" ? "#F59E0B" : "#9CA3AF";
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block", marginRight: 4 }} />;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #E5E4E0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#6B7280" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1px solid #E5E4E0", borderRadius: 8,
  fontSize: 14, outline: "none", background: "#F7F6F3", color: "#1A1A2E"
};

const selectStyle: React.CSSProperties = { ...inputStyle };
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 80, resize: "vertical" };

function Btn({ onClick, variant = "primary", children, disabled, style }: any) {
  const base: React.CSSProperties = { border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity .15s", ...style };
  const styles: Record<string, React.CSSProperties> = {
    primary: { ...base, background: "#E94560", color: "#fff" },
    secondary: { ...base, background: "#F3F4F6", color: "#374151" },
    ghost: { ...base, background: "none", color: "#6B7280", padding: "6px 10px" },
    danger: { ...base, background: "#FEF2F2", color: "#EF4444" },
  };
  return <button style={{ ...styles[variant], opacity: disabled ? 0.6 : 1 }} onClick={onClick} disabled={disabled}>{children}</button>;
}

// ── Add Company Modal ─────────────────────────────────────────────────────

function AddCompanyModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Company) => void }) {
  const [form, setForm] = useState({ name: "", role: "", status: "Researching" as Status, priority: "Medium" as Priority, location: "", jobUrl: "", appliedDate: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const res = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!data.error) { onSave(data); onClose(); }
  };

  const u = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Modal title="Add company" onClose={onClose}>
      <Field label="Company name *"><input style={inputStyle} value={form.name} onChange={u("name")} placeholder="e.g. Airbnb" autoFocus /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Role"><input style={inputStyle} value={form.role} onChange={u("role")} placeholder="e.g. Staff UX Designer" /></Field>
        <Field label="Location"><input style={inputStyle} value={form.location} onChange={u("location")} placeholder="e.g. Remote, SF" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Status">
          <select style={selectStyle} value={form.status} onChange={u("status")}>
            {["Researching","Applied","Interviewing","Offer","Rejected","Closed"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select style={selectStyle} value={form.priority} onChange={u("priority")}>
            {["High","Medium","Low"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Job posting URL"><input style={inputStyle} value={form.jobUrl} onChange={u("jobUrl")} placeholder="https://..." /></Field>
      <Field label="Applied date"><input style={{ ...inputStyle }} type="date" value={form.appliedDate} onChange={u("appliedDate")} /></Field>
      <Field label="Notes"><textarea style={textareaStyle} value={form.notes} onChange={u("notes")} placeholder="Key info, interview details, referrals..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving || !form.name}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save</Btn>
      </div>
    </Modal>
  );
}

// ── Add Contact Modal ─────────────────────────────────────────────────────

function AddContactModal({ companies, onClose, onSave }: { companies: Company[]; onClose: () => void; onSave: (c: Contact) => void }) {
  const [form, setForm] = useState({ name: "", role: "", relationship: "Connection" as Relationship, email: "", phone: "", linkedin: "", companyId: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const res = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!data.error) { onSave(data); onClose(); }
  };

  const u = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Modal title="Add contact" onClose={onClose}>
      <Field label="Name *"><input style={inputStyle} value={form.name} onChange={u("name")} placeholder="Full name" autoFocus /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Role / Title"><input style={inputStyle} value={form.role} onChange={u("role")} placeholder="e.g. Hiring Manager" /></Field>
        <Field label="Relationship">
          <select style={selectStyle} value={form.relationship} onChange={u("relationship")}>
            {["Recruiter","Hiring Manager","Interviewer","Referral","Connection"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Company">
        <select style={selectStyle} value={form.companyId} onChange={u("companyId")}>
          <option value="">— none —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Email"><input style={inputStyle} value={form.email} onChange={u("email")} placeholder="name@company.com" /></Field>
        <Field label="Phone"><input style={inputStyle} value={form.phone} onChange={u("phone")} placeholder="+1 (555) 000-0000" /></Field>
      </div>
      <Field label="LinkedIn URL"><input style={inputStyle} value={form.linkedin} onChange={u("linkedin")} placeholder="https://linkedin.com/in/..." /></Field>
      <Field label="Notes"><textarea style={textareaStyle} value={form.notes} onChange={u("notes")} placeholder="How you met, what they said, follow-up notes..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving || !form.name}>{saving ? <Loader2 size={14} /> : <Check size={14} />} Save</Btn>
      </div>
    </Modal>
  );
}

// ── Log Activity Modal ────────────────────────────────────────────────────

function LogActivityModal({ companies, contacts, preCompanyId, onClose, onSave }: {
  companies: Company[]; contacts: Contact[]; preCompanyId?: string;
  onClose: () => void; onSave: (a: Activity) => void;
}) {
  const [form, setForm] = useState({
    summary: "", type: "Note" as ActivityType, date: today(),
    companyId: preCompanyId || "", contactId: "", notes: ""
  });
  const [saving, setSaving] = useState(false);

  const filteredContacts = form.companyId
    ? contacts.filter(c => c.companyIds.includes(form.companyId))
    : contacts;

  const save = async () => {
    if (!form.summary) return;
    setSaving(true);
    const res = await fetch("/api/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!data.error) { onSave(data); onClose(); }
  };

  const u = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Modal title="Log activity" onClose={onClose}>
      <Field label="Summary *"><input style={inputStyle} value={form.summary} onChange={u("summary")} placeholder="e.g. Sent intro email to recruiter" autoFocus /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Type">
          <select style={selectStyle} value={form.type} onChange={u("type")}>
            {["Email sent","Email received","Phone call","Video call","Application submitted","Interview","Referral","Note"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Date"><input style={inputStyle} type="date" value={form.date} onChange={u("date")} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Company">
          <select style={selectStyle} value={form.companyId} onChange={u("companyId")}>
            <option value="">— none —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Contact">
          <select style={selectStyle} value={form.contactId} onChange={u("contactId")}>
            <option value="">— none —</option>
            {filteredContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Notes / Message content">
        <textarea style={textareaStyle} value={form.notes} onChange={u("notes")} placeholder="Paste the email, write call notes, or any details you want to remember..." />
      </Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving || !form.summary}>{saving ? <Loader2 size={14} /> : <Check size={14} />} Log it</Btn>
      </div>
    </Modal>
  );
}

// ── Company Detail Panel ──────────────────────────────────────────────────

function CompanyPanel({ company, contacts, activities, onClose, onActivityAdded, onStatusChange }: {
  company: Company; contacts: Contact[]; activities: Activity[];
  onClose: () => void; onActivityAdded: (a: Activity) => void; onStatusChange: (id: string, s: Status) => void;
}) {
  const [showLog, setShowLog] = useState(false);
  const myActivities = activities.filter(a => a.companyIds.includes(company.id));
  const myContacts = contacts.filter(c => c.companyIds.includes(company.id));

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: 480, background: "#fff",
      boxShadow: "-4px 0 30px rgba(0,0,0,0.1)", zIndex: 900, display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E4E0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>{company.name}</h2>
            {company.jobUrl && <a href={company.jobUrl} target="_blank" rel="noreferrer" style={{ color: "#E94560" }}><ExternalLink size={16} /></a>}
          </div>
          {company.role && <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 6 }}>{company.role}</div>}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge status={company.status} />
            {company.priority && <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center" }}><PriorityDot priority={company.priority} />{company.priority}</span>}
            {company.location && <span style={{ fontSize: 12, color: "#6B7280" }}>📍 {company.location}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}><X size={20} /></button>
      </div>

      {/* Status bar */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #E5E4E0", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["Researching","Applied","Interviewing","Offer","Rejected","Closed"] as Status[]).map(s => (
          <button key={s} onClick={() => onStatusChange(company.id, s)} style={{
            border: `1px solid ${company.status === s ? STATUS_COLORS[s] : "#E5E4E0"}`,
            background: company.status === s ? STATUS_COLORS[s] + "15" : "none",
            color: company.status === s ? STATUS_COLORS[s] : "#9CA3AF",
            borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer"
          }}>{s}</button>
        ))}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>

        {/* Notes */}
        {company.notes && (
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
            {company.notes}
          </div>
        )}

        {/* Key dates */}
        {(company.appliedDate || company.lastActivity) && (
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            {company.appliedDate && <div style={{ fontSize: 13 }}><span style={{ color: "#9CA3AF" }}>Applied: </span><strong>{formatDate(company.appliedDate)}</strong></div>}
            {company.lastActivity && <div style={{ fontSize: 13 }}><span style={{ color: "#9CA3AF" }}>Last activity: </span><strong>{formatDate(company.lastActivity)}</strong></div>}
          </div>
        )}

        {/* Contacts */}
        {myContacts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Contacts</h3>
            {myContacts.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F7F6F3", borderRadius: 8, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{c.role} {c.relationship && `· ${c.relationship}`}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {c.email && <a href={`mailto:${c.email}`} style={{ color: "#3B82F6" }}><Mail size={14} /></a>}
                  {c.phone && <a href={`tel:${c.phone}`} style={{ color: "#10B981" }}><Phone size={14} /></a>}
                  {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" style={{ color: "#0A66C2" }}><ExternalLink size={14} /></a>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activity log */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1 }}>Activity</h3>
            <Btn variant="ghost" onClick={() => setShowLog(true)} style={{ fontSize: 12, padding: "4px 8px" }}><Plus size={12} /> Log</Btn>
          </div>

          {myActivities.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#9CA3AF", fontSize: 14 }}>
              No activity yet. Log your first outreach.
            </div>
          )}

          {myActivities.map(a => {
            const Icon = ACTIVITY_ICONS[a.type] || MessageSquare;
            const color = ACTIVITY_COLORS[a.type] || "#9CA3AF";
            return (
              <div key={a.id} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <Icon size={14} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{a.summary}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{formatDate(a.date)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: color, marginBottom: a.notes ? 4 : 0 }}>{a.type}</div>
                  {a.notes && <div style={{ fontSize: 13, color: "#6B7280", background: "#F7F6F3", borderRadius: 6, padding: "8px 10px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.notes}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showLog && (
        <LogActivityModal
          companies={[company]} contacts={contacts} preCompanyId={company.id}
          onClose={() => setShowLog(false)}
          onSave={a => { onActivityAdded(a); setShowLog(false); }}
        />
      )}
    </div>
  );
}

// ── Dashboard View ────────────────────────────────────────────────────────

function Dashboard({ companies, activities, contacts }: { companies: Company[]; activities: Activity[]; contacts: Contact[] }) {
  const counts: Record<Status, number> = { Researching: 0, Applied: 0, Interviewing: 0, Offer: 0, Rejected: 0, Closed: 0 };
  companies.forEach(c => counts[c.status]++);
  const recent = [...activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Dashboard</h1>
      <p style={{ color: "#9CA3AF", marginBottom: 28, fontSize: 15 }}>Your job search at a glance</p>

      {/* Pipeline summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
        {(["Researching","Applied","Interviewing","Offer","Rejected"] as Status[]).map(s => (
          <div key={s} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${STATUS_COLORS[s]}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: STATUS_COLORS[s] }}>{counts[s]}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Recent activity</h2>
      {recent.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 32, textAlign: "center", color: "#9CA3AF" }}>
          No activity logged yet. Add a company and start tracking.
        </div>
      )}
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}>
        {recent.map((a, i) => {
          const Icon = ACTIVITY_ICONS[a.type] || MessageSquare;
          const color = ACTIVITY_COLORS[a.type] || "#9CA3AF";
          const company = companies.find(c => a.companyIds.includes(c.id));
          return (
            <div key={a.id} style={{ display: "flex", gap: 14, padding: "14px 20px", borderBottom: i < recent.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={15} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{a.summary}</span>
                  <span style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>{formatDate(a.date)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  <span style={{ color }}>{a.type}</span>
                  {company && <span> · {company.name}</span>}
                </div>
                {a.notes && <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4, background: "#F7F6F3", borderRadius: 6, padding: "6px 10px", whiteSpace: "pre-wrap" }}>{a.notes.slice(0, 200)}{a.notes.length > 200 ? "…" : ""}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Companies View ────────────────────────────────────────────────────────

function CompaniesView({ companies, contacts, activities, onAdd, onStatusChange, onSelect }: {
  companies: Company[]; contacts: Contact[]; activities: Activity[];
  onAdd: () => void; onStatusChange: (id: string, s: Status) => void; onSelect: (c: Company) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Status | "All">("All");

  const filtered = companies.filter(c =>
    (filter === "All" || c.status === filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Companies</h1>
          <p style={{ color: "#9CA3AF", fontSize: 15 }}>{companies.length} tracked</p>
        </div>
        <Btn onClick={onAdd}><Plus size={16} /> Add company</Btn>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", marginRight: 8 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input style={{ ...inputStyle, paddingLeft: 32, width: 200 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(["All","Researching","Applied","Interviewing","Offer","Rejected","Closed"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            border: `1px solid ${filter === s ? (s === "All" ? "#1A1A2E" : STATUS_COLORS[s as Status]) : "#E5E4E0"}`,
            background: filter === s ? (s === "All" ? "#1A1A2E" : STATUS_COLORS[s as Status] + "15") : "none",
            color: filter === s ? (s === "All" ? "#fff" : STATUS_COLORS[s as Status]) : "#6B7280",
            borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: "#9CA3AF" }}>
          {companies.length === 0 ? "No companies yet. Add your first one." : "No matches."}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(c => {
          const actCount = activities.filter(a => a.companyIds.includes(c.id)).length;
          const contactCount = contacts.filter(ct => ct.companyIds.includes(c.id)).length;
          return (
            <div key={c.id} onClick={() => onSelect(c)} style={{
              background: "#fff", borderRadius: 12, padding: "16px 20px", cursor: "pointer",
              border: "1px solid transparent", transition: "border-color .15s, box-shadow .15s",
              display: "flex", alignItems: "center", gap: 16
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E4E0"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: STATUS_COLORS[c.status] + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Briefcase size={20} color={STATUS_COLORS[c.status]} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</span>
                  <StatusBadge status={c.status} />
                  <PriorityDot priority={c.priority} />
                </div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>
                  {c.role && <span>{c.role}</span>}
                  {c.location && <span> · {c.location}</span>}
                  {c.appliedDate && <span> · Applied {formatDate(c.appliedDate)}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, flexShrink: 0, color: "#9CA3AF", fontSize: 13 }}>
                {contactCount > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={13} />{contactCount}</span>}
                {actCount > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ActivityIcon size={13} />{actCount}</span>}
                <ChevronRight size={16} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Contacts View ─────────────────────────────────────────────────────────

function ContactsView({ contacts, companies, onAdd }: { contacts: Contact[]; companies: Company[]; onAdd: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()));

  const relColor: Record<Relationship, string> = {
    Recruiter: "#3B82F6", "Hiring Manager": "#8B5CF6", Interviewer: "#F59E0B", Referral: "#10B981", Connection: "#9CA3AF"
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Contacts</h1>
          <p style={{ color: "#9CA3AF", fontSize: 15 }}>{contacts.length} people</p>
        </div>
        <Btn onClick={onAdd}><Plus size={16} /> Add contact</Btn>
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 280 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
        <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: "#9CA3AF" }}>
          {contacts.length === 0 ? "No contacts yet. Add the people you're in touch with." : "No matches."}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {filtered.map(c => {
          const company = companies.find(co => c.companyIds.includes(co.id));
          const color = relColor[c.relationship] || "#9CA3AF";
          return (
            <div key={c.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{c.role}</div>
                  {company && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{company.name}</div>}
                </div>
                <span style={{ background: color + "15", color, border: `1px solid ${color}30`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{c.relationship}</span>
              </div>
              {c.notes && <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12, background: "#F7F6F3", borderRadius: 6, padding: "8px 10px", lineHeight: 1.5 }}>{c.notes.slice(0, 120)}{c.notes.length > 120 ? "…" : ""}</div>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {c.email && <a href={`mailto:${c.email}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#3B82F6", textDecoration: "none" }}><Mail size={13} />{c.email}</a>}
                {c.phone && <a href={`tel:${c.phone}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#10B981", textDecoration: "none" }}><Phone size={13} />{c.phone}</a>}
                {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#0A66C2", textDecoration: "none" }}><ExternalLink size={13} />LinkedIn</a>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Activity View ─────────────────────────────────────────────────────────

function ActivityView({ activities, companies, contacts, onAdd }: {
  activities: Activity[]; companies: Company[]; contacts: Contact[]; onAdd: () => void;
}) {
  const [filter, setFilter] = useState<ActivityType | "All">("All");
  const filtered = filter === "All" ? activities : activities.filter(a => a.type === filter);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Activity</h1>
          <p style={{ color: "#9CA3AF", fontSize: 15 }}>{activities.length} logged</p>
        </div>
        <Btn onClick={onAdd}><Plus size={16} /> Log activity</Btn>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {(["All","Email sent","Email received","Phone call","Video call","Application submitted","Interview","Note"] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            border: `1px solid ${filter === t ? "#E94560" : "#E5E4E0"}`,
            background: filter === t ? "#FFF0F3" : "none",
            color: filter === t ? "#E94560" : "#6B7280",
            borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>{t}</button>
        ))}
      </div>

      {sorted.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: "#9CA3AF" }}>
          No activity yet. Start logging your outreach.
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {sorted.map(a => {
          const Icon = ACTIVITY_ICONS[a.type] || MessageSquare;
          const color = ACTIVITY_COLORS[a.type] || "#9CA3AF";
          const company = companies.find(c => a.companyIds.includes(c.id));
          const contact = contacts.find(c => a.contactIds.includes(c.id));
          return (
            <div key={a.id} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{a.summary}</span>
                  <span style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>{formatDate(a.date)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: a.notes ? 8 : 0 }}>
                  <span style={{ color, fontWeight: 600 }}>{a.type}</span>
                  {company && <span> · {company.name}</span>}
                  {contact && <span> · {contact.name}</span>}
                </div>
                {a.notes && <div style={{ fontSize: 13, color: "#374151", background: "#F7F6F3", borderRadius: 8, padding: "10px 12px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{a.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────

type View = "dashboard" | "companies" | "contacts" | "activity";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, ct, a] = await Promise.all([
        fetch("/api/companies").then(r => r.json()),
        fetch("/api/contacts").then(r => r.json()),
        fetch("/api/activities").then(r => r.json()),
      ]);
      if (c.error || ct.error || a.error) { setError(c.error || ct.error || a.error); return; }

      // Enrich with names
      const compMap: Record<string, string> = {};
      (c as Company[]).forEach((co: Company) => { compMap[co.id] = co.name; });
      const contactMap: Record<string, string> = {};
      (ct as Contact[]).forEach((co: Contact) => { contactMap[co.id] = co.name; });

      const enrichedContacts = (ct as Contact[]).map((co: Contact) => ({
        ...co,
        companyNames: co.companyIds.map((id: string) => compMap[id] || "").filter(Boolean),
      }));
      const enrichedActivities = (a as Activity[]).map((act: Activity) => ({
        ...act,
        companyNames: act.companyIds.map((id: string) => compMap[id] || "").filter(Boolean),
        contactNames: act.contactIds.map((id: string) => contactMap[id] || "").filter(Boolean),
      }));

      setCompanies(c);
      setContacts(enrichedContacts);
      setActivities(enrichedActivities);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: Status) => {
    await fetch(`/api/companies/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, lastActivity: today() }) });
    setCompanies(cs => cs.map(c => c.id === id ? { ...c, status } : c));
    if (selectedCompany?.id === id) setSelectedCompany(sc => sc ? { ...sc, status } : null);
  };

  const navItems: { id: View; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "companies", label: "Companies", icon: Briefcase },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "activity", label: "Activity", icon: ActivityIcon },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#1A1A2E", display: "flex", flexDirection: "column", flexShrink: 0, position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 800 }}>
        <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>Job Tracker</div>
          <div style={{ fontSize: 12, color: "#4B5563", marginTop: 2 }}>2026 Search</div>
        </div>

        <nav style={{ padding: "8px 12px", flex: 1 }}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setView(id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
              borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, textAlign: "left",
              background: view === id ? "#0F3460" : "transparent",
              color: view === id ? "#fff" : "#6B7280", fontSize: 14, fontWeight: view === id ? 600 : 400,
              transition: "background .15s, color .15s"
            }}>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid #0F1929" }}>
          <button onClick={() => setShowLogActivity(true)} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
            borderRadius: 8, border: "none", cursor: "pointer", background: "#E94560",
            color: "#fff", fontSize: 14, fontWeight: 600
          }}>
            <Plus size={16} /> Log activity
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, padding: "32px 36px", maxWidth: "calc(100vw - 220px)", minHeight: "100vh" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "#9CA3AF" }}>
            <Loader2 size={24} className="animate-spin" /> Loading from Notion…
          </div>
        )}
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: "#EF4444" }}>Connection error</div>
              <div style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>{error}</div>
            </div>
          </div>
        )}
        {!loading && !error && (
          <>
            {view === "dashboard" && <Dashboard companies={companies} activities={activities} contacts={contacts} />}
            {view === "companies" && (
              <CompaniesView
                companies={companies} contacts={contacts} activities={activities}
                onAdd={() => setShowAddCompany(true)}
                onStatusChange={updateStatus}
                onSelect={setSelectedCompany}
              />
            )}
            {view === "contacts" && <ContactsView contacts={contacts} companies={companies} onAdd={() => setShowAddContact(true)} />}
            {view === "activity" && (
              <ActivityView activities={activities} companies={companies} contacts={contacts} onAdd={() => setShowLogActivity(true)} />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddCompany && <AddCompanyModal onClose={() => setShowAddCompany(false)} onSave={c => { setCompanies(cs => [c, ...cs]); setShowAddCompany(false); }} />}
      {showAddContact && <AddContactModal companies={companies} onClose={() => setShowAddContact(false)} onSave={c => { setContacts(cs => [c, ...cs]); setShowAddContact(false); }} />}
      {showLogActivity && (
        <LogActivityModal companies={companies} contacts={contacts} onClose={() => setShowLogActivity(false)}
          onSave={a => { setActivities(acts => [a, ...acts]); setShowLogActivity(false); }} />
      )}

      {/* Company detail panel */}
      {selectedCompany && (
        <CompanyPanel
          company={selectedCompany} contacts={contacts} activities={activities}
          onClose={() => setSelectedCompany(null)}
          onActivityAdded={a => { setActivities(acts => [a, ...acts]); }}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}
