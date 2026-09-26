/** Application-wide constants: workspace keys, RBAC, page registry. */
import type { Role, WorkspaceKey } from './types';
import type { IconName } from '@/ui/icons';

/** Keys persisted as the user's working dataset (synced to the backend). */
export const WORKSPACE_KEYS: readonly WorkspaceKey[] = [
  'users',
  'organization',
  'assets',
  'assetThreats',
  'riskCriteria',
  'risks',
  'auditChecklist',
  'evidence',
  'findings',
  'activityLog',
] as const;

export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACTIVITY_LOG_LIMIT = 50;

/** Every routable page in the app. */
export type PageId =
  | 'dashboard'
  | 'users'
  | 'organization'
  | 'assets'
  | 'threats'
  | 'risk'
  | 'audit'
  | 'evidence'
  | 'compliance'
  | 'findings'
  | 'ai'
  | 'report'
  | 'settings'
  | 'docs';

export interface PageMeta {
  title: string;
  icon: IconName;
  /** Position in the OCTAVE module numbering (1-11), if applicable. */
  moduleNumber?: number;
}

export const PAGES: Record<PageId, PageMeta> = {
  dashboard: { title: 'Dashboard', icon: 'layout-dashboard' },
  users: { title: 'User Management', icon: 'users', moduleNumber: 1 },
  organization: { title: 'Organization Profile', icon: 'building', moduleNumber: 2 },
  assets: { title: 'Asset Inventory', icon: 'boxes', moduleNumber: 3 },
  threats: { title: 'Threats & Vulnerabilities', icon: 'crosshair', moduleNumber: 4 },
  risk: { title: 'Risk Assessment', icon: 'gauge', moduleNumber: 5 },
  audit: { title: 'Audit Checklist', icon: 'clipboard-check', moduleNumber: 6 },
  evidence: { title: 'Evidence Collection', icon: 'paperclip', moduleNumber: 7 },
  compliance: { title: 'Compliance Scoring', icon: 'bar-chart', moduleNumber: 8 },
  findings: { title: 'Audit Findings', icon: 'alert-triangle', moduleNumber: 9 },
  ai: { title: 'AI Assistant', icon: 'sparkles', moduleNumber: 10 },
  report: { title: 'Report Generator', icon: 'file-text', moduleNumber: 11 },
  settings: { title: 'Settings', icon: 'settings' },
  docs: { title: 'User Manual', icon: 'book-open' },
};

/** Sidebar grouping of pages. */
export const NAV_GROUPS: { label: string; items: PageId[] }[] = [
  { label: 'Overview', items: ['dashboard'] },
  { label: 'Governance', items: ['users', 'organization', 'assets'] },
  { label: 'Risk Analysis', items: ['threats', 'risk'] },
  { label: 'Security Audit', items: ['audit', 'evidence', 'compliance'] },
  { label: 'Results', items: ['findings', 'ai', 'report'] },
  { label: 'System', items: ['settings', 'docs'] },
];

interface RolePermission {
  access: PageId[];
  edit: PageId[];
}

export const ROLE_PERMISSIONS: Record<Role, RolePermission> = {
  admin: {
    access: [
      'dashboard',
      'users',
      'organization',
      'assets',
      'threats',
      'risk',
      'audit',
      'evidence',
      'compliance',
      'findings',
      'ai',
      'report',
      'settings',
      'docs',
    ],
    edit: [
      'users',
      'organization',
      'assets',
      'threats',
      'risk',
      'audit',
      'evidence',
      'findings',
      'settings',
    ],
  },
  auditor: {
    access: [
      'dashboard',
      'users',
      'organization',
      'assets',
      'threats',
      'risk',
      'audit',
      'evidence',
      'compliance',
      'findings',
      'ai',
      'report',
      'settings',
      'docs',
    ],
    edit: [
      'organization',
      'assets',
      'threats',
      'risk',
      'audit',
      'evidence',
      'findings',
      'settings',
    ],
  },
  auditee: {
    access: ['dashboard', 'evidence', 'findings', 'ai', 'settings', 'docs'],
    edit: ['evidence', 'settings'],
  },
};

export function canAccess(role: Role | undefined, page: PageId): boolean {
  return (ROLE_PERMISSIONS[role ?? 'auditee'] ?? ROLE_PERMISSIONS.auditee).access.includes(page);
}

export function canEdit(role: Role | undefined, page: PageId): boolean {
  return (ROLE_PERMISSIONS[role ?? 'auditee'] ?? ROLE_PERMISSIONS.auditee).edit.includes(page);
}

/**
 * Pages that contain editable data entry (any role can edit them in principle).
 * Read-only-by-nature pages (dashboard, compliance, ai, report, docs) are NOT
 * here, so they never display a "View Only" badge.
 */
const EDITABLE_PAGES = new Set<PageId>(Object.values(ROLE_PERMISSIONS).flatMap((p) => p.edit));

/** Whether the "View Only" treatment should apply for this role + page. */
export function isViewOnly(role: Role | undefined, page: PageId): boolean {
  return EDITABLE_PAGES.has(page) && !canEdit(role, page);
}
