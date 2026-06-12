import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

export const COMPANIES_DB = process.env.NOTION_COMPANIES_DB!;
export const CONTACTS_DB = process.env.NOTION_CONTACTS_DB!;
export const ACTIVITY_DB = process.env.NOTION_ACTIVITY_DB!;

// ── Types ──────────────────────────────────────────────────────────────────

export type Status = "Researching" | "Applied" | "Interviewing" | "Offer" | "Rejected" | "Closed";
export type Priority = "High" | "Medium" | "Low";
export type ActivityType = "Email sent" | "Email received" | "Phone call" | "Video call" | "Application submitted" | "Interview" | "Referral" | "Note";
export type Relationship = "Recruiter" | "Hiring Manager" | "Interviewer" | "Referral" | "Connection";

export interface Company {
  id: string;
  name: string;
  status: Status;
  role: string;
  location: string;
  jobUrl: string;
  appliedDate: string;
  lastActivity: string;
  priority: Priority;
  notes: string;
  url: string;
}

export interface Contact {
  id: string;
  name: string;
  companyIds: string[];
  companyNames: string[];
  role: string;
  email: string;
  phone: string;
  linkedin: string;
  relationship: Relationship;
  notes: string;
  url: string;
}

export interface Activity {
  id: string;
  summary: string;
  companyIds: string[];
  companyNames: string[];
  contactIds: string[];
  contactNames: string[];
  type: ActivityType;
  date: string;
  notes: string;
  url: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getText(prop: any): string {
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

function getRelationNames(prop: any): { ids: string[]; names: string[] } {
  if (!prop || prop.type !== "relation") return { ids: [], names: [] };
  return {
    ids: prop.relation?.map((r: any) => r.id) ?? [],
    names: [],
  };
}

export function parseCompany(page: any): Company {
  const p = page.properties;
  return {
    id: page.id,
    name: getText(p.Company),
    status: (getText(p.Status) as Status) || "Researching",
    role: getText(p.Role),
    location: getText(p.Location),
    jobUrl: getText(p["Job URL"]),
    appliedDate: getText(p["Applied Date"]),
    lastActivity: getText(p["Last Activity"]),
    priority: (getText(p.Priority) as Priority) || "Medium",
    notes: getText(p.Notes),
    url: page.url,
  };
}

export function parseContact(page: any): Contact {
  const p = page.properties;
  const company = getRelationNames(p.Company);
  return {
    id: page.id,
    name: getText(p.Name),
    companyIds: company.ids,
    companyNames: [],
    role: getText(p.Role),
    email: getText(p.Email),
    phone: getText(p.Phone),
    linkedin: getText(p.LinkedIn),
    relationship: (getText(p.Relationship) as Relationship) || "Connection",
    notes: getText(p.Notes),
    url: page.url,
  };
}

export function parseActivity(page: any): Activity {
  const p = page.properties;
  const company = getRelationNames(p.Company);
  const contact = getRelationNames(p.Contact);
  return {
    id: page.id,
    summary: getText(p.Summary),
    companyIds: company.ids,
    companyNames: [],
    contactIds: contact.ids,
    contactNames: [],
    type: (getText(p.Type) as ActivityType) || "Note",
    date: getText(p.Date),
    notes: getText(p.Notes),
    url: page.url,
  };
}
