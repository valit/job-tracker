import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

export const COMPANIES_DB = process.env.NOTION_COMPANIES_DB!;
export const JOBS_DB = process.env.NOTION_JOBS_DB!;
export const ACTIVITY_DB = process.env.NOTION_ACTIVITY_DB!;
export const ASSETS_DB = process.env.NOTION_ASSETS_DB!;

// ── Types ──────────────────────────────────────────────────────────────────

export type JobStatus =
  | "Want to apply"
  | "Applied (no response)"
  | "Applied (referred)"
  | "In progress"
  | "Closed";

export type ActivityType =
  | "Email sent"
  | "Email received"
  | "Phone call"
  | "Video call"
  | "Application submitted"
  | "Interview"
  | "Referral submitted"
  | "Note"
  | "Job created";

export type AssetType = "URL" | "Gmail link" | "Google Drive link" | "Contact";
export type PersonTitle = "Recruiter" | "Hiring Manager" | "Interviewer" | "Referral" | "Connection";

export interface CompanyLink {
  label: string;
  url: string;
  type: string;
}

export interface Company {
  id: string;
  name: string;
  notes: string;
  logoUrl: string;
  links: CompanyLink[];
  url: string;
}

export interface Job {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string;
  status: JobStatus;
  archived: boolean;
  notes: string;
  location: string;
  createdAt: string;
  url: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  date: string;
  notes: string;
  jobId: string;
  jobName: string;
  url: string;
}

export interface Asset {
  id: string;
  type: AssetType;
  label: string;
  assetUrl: string;
  // Person fields
  personName: string;
  personTitle: PersonTitle | "";
  personEmail: string;
  personPhone: string;
  personLinkedin: string;
  personNotes: string;
  // Links
  companyId: string;
  jobId: string;
  activityId: string;
  url: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.map((t: any) => t.plain_text).join("") ?? "";
  if (prop.type === "rich_text") return prop.rich_text?.map((t: any) => t.plain_text).join("") ?? "";
  if (prop.type === "select") return prop.select?.name ?? "";
  if (prop.type === "url") return prop.url ?? "";
  if (prop.type === "email") return prop.email ?? "";
  if (prop.type === "phone_number") return prop.phone_number ?? "";
  if (prop.type === "date") return prop.date?.start ?? "";
  return "";
}

function getRelationId(prop: any): string {
  if (!prop || prop.type !== "relation") return "";
  return prop.relation?.[0]?.id ?? "";
}

// ── Parsers ────────────────────────────────────────────────────────────────

export function parseCompany(page: any): Company {
  const p = page.properties;
  let links: CompanyLink[] = [];
  try { links = JSON.parse(getText(p.Links) || "[]"); } catch {}
  return {
    id: page.id,
    name: getText(p.Name) || getText(p.Company),
    notes: getText(p.Notes),
    logoUrl: getText(p["Logo URL"]),
    links,
    url: page.url,
  };
}

export function parseJob(page: any): Job {
  const p = page.properties;
  return {
    id: page.id,
    name: getText(p.Name),
    companyId: getRelationId(p.Company),
    companyName: "",
    companyLogoUrl: "",
    status: (getText(p.Status) as JobStatus) || "Want to apply",
    archived: p.Archived?.checkbox === true,
    notes: getText(p.Notes),
    location: getText(p.Location),
    createdAt: page.created_time ?? "",
    url: page.url,
  };
}

export function parseActivity(page: any): Activity {
  const p = page.properties;
  return {
    id: page.id,
    type: (getText(p.Type) as ActivityType) || "Note",
    date: getText(p.Date),
    // Notes may be a rich_text field; fall back to Summary or Name title if absent
    notes: getText(p.Notes) || getText(p.Summary) || getText(p.Name),
    jobId: getRelationId(p.Job),
    jobName: "",
    url: page.url,
  };
}

export function parseAsset(page: any): Asset {
  const p = page.properties;
  return {
    id: page.id,
    type: (getText(p.Type) as AssetType) || "URL",
    label: getText(p.Label) || getText(p.Name),
    assetUrl: getText(p.URL),
    personName: getText(p["Person Name"]),
    personTitle: (getText(p["Person Title"]) as PersonTitle) || "",
    personEmail: getText(p["Person Email"]),
    personPhone: getText(p["Person Phone"]),
    personLinkedin: getText(p["Person LinkedIn"]),
    personNotes: getText(p["Person Notes"]),
    companyId: getRelationId(p.Company),
    jobId: getRelationId(p.Job),
    activityId: getRelationId(p.Activity),
    url: page.url,
  };
}
