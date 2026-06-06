/**
 * Domain model — the single source of truth for every data shape in the app.
 * Services, features and the UI all import from here, so a change to a shape
 * surfaces as a compile error everywhere it is used.
 */

// ----- Identity & access -----
export type Role = 'admin' | 'auditor' | 'auditee';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface WorkspaceUser {
  name: string;
  email: string;
  role: Role;
  active: boolean;
  /** The seed account derived from the signed-in user; cannot be deleted. */
  system?: boolean;
}

// ----- Organization -----
export type Sector =
  | 'Education'
  | 'Healthcare'
  | 'Finance'
  | 'Government'
  | 'Technology'
  | 'Retail'
  | 'Manufacturing'
  | 'Other';

export type EmployeeBand = '1-50' | '51-200' | '201-1000' | '1000+';

export type SystemType =
  | 'Web Application'
  | 'Mobile Application'
  | 'Internal Network'
  | 'Cloud Infrastructure'
  | 'Hybrid';

export interface Organization {
  /** Empty string means "no profile defined yet". */
  name: string;
  sector?: Sector;
  employees?: EmployeeBand;
  system?: SystemType;
}

/** A blank organization profile. */
export const EMPTY_ORGANIZATION: Organization = { name: '' };

// ----- Assets (OCTAVE Allegro steps 2 & 3) -----
export type CiaLevel = 'High' | 'Medium' | 'Low';
export type AssetType = 'Application' | 'Server' | 'Data' | 'Network' | 'Endpoint';
export type AssetLocation = 'Cloud Server' | 'On-Premise' | 'Hybrid' | 'Third-Party';

export interface Asset {
  name: string;
  owner: string;
  type: AssetType;
  location: AssetLocation;
  description: string;
  confidentiality: CiaLevel;
  integrity: CiaLevel;
  availability: CiaLevel;
  containers: string[];
}

// ----- Threats & vulnerabilities (OWASP-based) -----
export type VulnerabilityCategory =
  | 'Injection'
  | 'Broken Authentication'
  | 'Sensitive Data Exposure'
  | 'Access Control Failures'
  | 'Security Misconfiguration'
  | 'Cross-Site Attacks'
  | 'Logging & Monitoring Failure'
  | 'Dependency & Software Issues';

export interface Vulnerability {
  id: string;
  category: VulnerabilityCategory;
  name: string;
  description: string;
  defaultLikelihood: number;
  defaultImpact: number;
  impactExample: string;
  auditChecklistItem: string;
  mitigation: string;
}

/** Map of asset name -> selected vulnerability ids. */
export type AssetThreatMap = Record<string, string[]>;

// ----- Risk (OCTAVE Allegro steps 1, 6, 7, 8) -----
export type RiskLevelLabel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface RiskLevel {
  label: RiskLevelLabel;
  min: number;
  max: number;
}

export interface Risk {
  asset: string;
  threat: string;
  vulnerability: string;
  likelihood: number;
  impact: number;
  score: number;
  impactDesc: string;
  mitigation: string;
  category: VulnerabilityCategory;
}

export interface ImpactArea {
  id: string;
  name: string;
  description: string;
}

export interface CriteriaThreshold {
  low: string;
  med: string;
  high: string;
}

export type RiskCriteria = Record<string, CriteriaThreshold>;

// ----- Audit checklist & compliance -----
export type ControlStatus = 'pending' | 'compliant' | 'partially' | 'non-compliant' | 'na';

export interface ChecklistItem {
  title: string;
  description: string;
  source: string;
  status: ControlStatus;
  notes: string;
}

export interface ComplianceStats {
  compliant: number;
  partial: number;
  nonComp: number;
  pending: number;
  na: number;
  applicable: number;
  pct: number;
  label: 'Compliant' | 'Needs Improvement' | 'Non-Compliant';
  opinion: 'Secure' | 'Acceptable Risk' | 'Needs Immediate Action';
}

// ----- Evidence -----
export interface EvidenceItem {
  name: string;
  type: string;
  size: number;
  data: string;
  storagePath?: string;
  stored?: 'cloud' | 'local';
  date: string;
}

// ----- Findings -----
export interface Finding {
  issue: string;
  risk: string;
  asset: string;
  recommendation: string;
  riskScore: number;
}

// ----- Activity log -----
export type ActivityColor =
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'high'
  | 'critical'
  | 'medium'
  | 'low';

export interface ActivityEntry {
  action: string;
  detail: string;
  color: ActivityColor;
  time: string;
}

// ----- Container types (OCTAVE Allegro step 3) -----
export interface ContainerType {
  id: string;
  name: string;
  examples: string[];
}

// ----- Knowledge base (offline AI fallback) -----
export interface KnowledgeEntry {
  keys: string[];
  title: string;
  body: string;
}

export interface FrameworkRef {
  iso: string;
  nist: string;
}

/**
 * The complete persisted dataset for one workspace. Keys here are exactly the
 * keys synced to the backend (see {@link WORKSPACE_KEYS}).
 */
export interface WorkspaceData {
  users: WorkspaceUser[];
  organization: Organization;
  assets: Asset[];
  assetThreats: AssetThreatMap;
  riskCriteria: RiskCriteria;
  risks: Risk[];
  auditChecklist: ChecklistItem[];
  evidence: EvidenceItem[];
  findings: Finding[];
  activityLog: ActivityEntry[];
}

export type WorkspaceKey = keyof WorkspaceData;
