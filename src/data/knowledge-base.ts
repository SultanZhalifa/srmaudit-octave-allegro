/**
 * OWASP / OCTAVE knowledge base — real, factual reference material used by the
 * AI Assistant when no API key is configured. This is sourced reference content
 * an auditor can rely on, not generated filler.
 */
import type { KnowledgeEntry } from '@/core/types';

export const KNOWLEDGE_BASE: readonly KnowledgeEntry[] = [
  {
    keys: ['octave', 'allegro', 'methodology', 'framework', '8 step', 'eight step'],
    title: 'OCTAVE Allegro Methodology',
    body: 'OCTAVE Allegro is a streamlined, information-asset-centric risk assessment method developed by the CERT Division of the Carnegie Mellon Software Engineering Institute. It runs in 8 steps across 4 phases:\n\nPhase 1 — Establish Drivers: (1) Establish Risk Measurement Criteria.\nPhase 2 — Profile Assets: (2) Develop Information Asset Profile, (3) Identify Information Asset Containers.\nPhase 3 — Identify Threats: (4) Identify Areas of Concern, (5) Identify Threat Scenarios.\nPhase 4 — Identify & Mitigate Risks: (6) Identify Risks, (7) Analyze Risks, (8) Select Mitigation Approach.\n\nRisk is quantified as Likelihood × Impact, producing a 1–25 score that maps to Low / Medium / High / Critical bands.',
  },
  {
    keys: ['risk criteria', 'measurement criteria', 'impact area', 'step 1'],
    title: 'Risk Measurement Criteria (Step 1)',
    body: "Step 1 defines the organisation's impact areas and the thresholds that separate Low, Medium and High impact for each. The standard impact areas are: Reputation & Customer Confidence, Financial, Productivity, Safety & Health, and Legal & Regulatory. Prioritising these areas lets you score consequences consistently across every asset rather than judging each risk in isolation.",
  },
  {
    keys: ['container', 'step 3', 'where stored'],
    title: 'Information Asset Containers (Step 3)',
    body: 'A container is any place an information asset is stored, transported, or processed. OCTAVE Allegro groups containers into three types: Technical (servers, databases, applications, network devices), Physical (offices, filing cabinets, printed documents, removable media), and People (administrators, developers, vendors). Mapping containers reveals where controls must actually be applied — risk follows the asset into every container that touches it.',
  },
  {
    keys: ['sql injection', 'sqli'],
    title: 'SQL Injection',
    body: 'SQL Injection lets an attacker insert malicious SQL through unvalidated input, allowing them to read, modify, or destroy database contents and sometimes execute commands on the host. Business impact: mass theft of records, regulatory fines, and reputational damage.\n\nControls: use parameterised queries / prepared statements everywhere, apply strict input validation, enforce least-privilege database accounts, and deploy a Web Application Firewall as defence in depth.',
  },
  {
    keys: ['xss', 'cross-site scripting', 'cross site scripting'],
    title: 'Cross-Site Scripting (XSS)',
    body: 'XSS injects attacker-controlled script into pages other users view, enabling session theft, credential capture, and defacement. Controls: contextual output encoding, a strict Content-Security-Policy header, HttpOnly cookies, and server-side input sanitisation. Treat all user-supplied data as untrusted until encoded for its output context.',
  },
  {
    keys: ['password', 'authentication', 'mfa', 'lockout', 'brute force'],
    title: 'Authentication Hardening',
    body: 'Weak authentication is among the most exploited weaknesses. Recommended controls: enforce 12+ character passwords screened against known-breached lists, require multi-factor authentication for all privileged and remote access, lock accounts after ~5 failed attempts with progressive delays, set secure/HttpOnly/SameSite session cookies, and expire idle sessions.',
  },
  {
    keys: ['backup', 'ransomware', 'recovery'],
    title: 'Backup & Recovery',
    body: 'Operating without tested backups makes ransomware, hardware failure, and human error unrecoverable. Apply the 3-2-1 rule: three copies, on two media types, with one off-site (and ideally offline/immutable). Test restoration at least quarterly, encrypt backups, and document recovery time/point objectives (RTO/RPO).',
  },
  {
    keys: ['encryption', 'tls', 'https', 'data exposure'],
    title: 'Data Protection in Transit & at Rest',
    body: 'Protect confidentiality by enforcing TLS 1.2+ (prefer 1.3) for all traffic with HSTS, and encrypting data at rest with AES-256. Deprecate MD5, SHA-1, and DES. Manage keys in a dedicated key-management system and rotate them on a defined schedule.',
  },
  {
    keys: ['logging', 'monitoring', 'siem', 'audit log', 'incident'],
    title: 'Logging, Monitoring & Incident Response',
    body: 'Without security logging, breaches go undetected. Centralise authentication, authorisation, and data-access logs; retain them 90+ days; alert on anomalies; and maintain a documented, tested incident response plan with defined roles. Detection time is the single biggest factor in breach cost.',
  },
  {
    keys: ['executive summary', 'report', 'board', 'management'],
    title: 'Writing the Executive Summary',
    body: 'An effective audit executive summary states the scope (assets and controls assessed), the methodology (OCTAVE Allegro), the overall compliance posture as a percentage, the count of critical/high findings, and a single clear opinion (e.g. "Acceptable Risk"). Lead with business impact, not technical detail, and close with prioritised, time-bound recommendations for management.',
  },
];

/** Retrieve the best-matching knowledge entry by keyword overlap, or null. */
export function findKnowledge(query: string): KnowledgeEntry | null {
  const lower = query.toLowerCase();
  let best: KnowledgeEntry | null = null;
  let bestScore = 0;
  for (const entry of KNOWLEDGE_BASE) {
    const score = entry.keys.reduce((acc, k) => acc + (lower.includes(k) ? k.length : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best : null;
}
