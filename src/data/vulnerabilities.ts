/**
 * OWASP-based vulnerability catalogue. Real reference content, typed against
 * the domain model so every consumer gets autocomplete and compile-time safety.
 */
import type { Vulnerability } from '@/core/types';

export const VULNERABILITIES: readonly Vulnerability[] = [
  // ----- Injection -----
  {
    id: 'VULN-001',
    category: 'Injection',
    name: 'SQL Injection',
    description:
      'Attacker injects malicious SQL queries through user input to manipulate or extract database contents.',
    defaultLikelihood: 4,
    defaultImpact: 5,
    impactExample:
      'Database theft — complete extraction of student records, financial data, and credentials.',
    auditChecklistItem:
      'Verify that all database queries use parameterized statements or prepared queries.',
    mitigation:
      'Use parameterized queries/prepared statements, implement input validation, deploy WAF rules.',
  },
  {
    id: 'VULN-002',
    category: 'Injection',
    name: 'Command Injection',
    description:
      'Attacker executes arbitrary operating system commands through vulnerable application inputs.',
    defaultLikelihood: 3,
    defaultImpact: 5,
    impactExample:
      'Full server compromise — attacker gains shell access and control of the host system.',
    auditChecklistItem:
      'Verify that system commands are not constructed using user-supplied input.',
    mitigation:
      'Avoid system calls with user input, use allowlists for permitted commands, sandbox execution.',
  },
  {
    id: 'VULN-003',
    category: 'Injection',
    name: 'LDAP Injection',
    description:
      'Attacker manipulates LDAP queries to bypass authentication or access unauthorized directory information.',
    defaultLikelihood: 2,
    defaultImpact: 4,
    impactExample:
      'Authentication bypass — attacker logs in as any user without valid credentials.',
    auditChecklistItem:
      'Verify that LDAP queries properly escape special characters from user input.',
    mitigation:
      'Escape LDAP special characters, validate input against allowlists, use frameworks with built-in protection.',
  },

  // ----- Broken Authentication -----
  {
    id: 'VULN-004',
    category: 'Broken Authentication',
    name: 'Weak Password Policy',
    description:
      'System allows users to set weak passwords that are easily guessable or brute-forced.',
    defaultLikelihood: 4,
    defaultImpact: 4,
    impactExample:
      'Account takeover — attacker gains access to user accounts through password guessing.',
    auditChecklistItem:
      'Verify password policy enforces minimum 8 characters, uppercase, lowercase, numbers, and special characters.',
    mitigation:
      'Enforce minimum 12-character passwords with complexity requirements, implement password strength meter.',
  },
  {
    id: 'VULN-005',
    category: 'Broken Authentication',
    name: 'No Account Lockout',
    description:
      'System does not lock accounts after repeated failed login attempts, enabling brute-force attacks.',
    defaultLikelihood: 4,
    defaultImpact: 3,
    impactExample:
      'Brute-force success — attacker systematically tries passwords until gaining access.',
    auditChecklistItem:
      'Verify account lockout activates after 5 consecutive failed login attempts.',
    mitigation:
      'Implement account lockout after 5 failed attempts, add CAPTCHA, enable multi-factor authentication.',
  },
  {
    id: 'VULN-006',
    category: 'Broken Authentication',
    name: 'Session Hijacking',
    description: 'Attacker steals or predicts session tokens to impersonate legitimate users.',
    defaultLikelihood: 3,
    defaultImpact: 5,
    impactExample:
      'User impersonation — attacker performs actions as the victim including financial transactions.',
    auditChecklistItem:
      'Verify session tokens are cryptographically random, expire on logout, and use secure/httpOnly flags.',
    mitigation:
      'Use secure session management, set HttpOnly and Secure cookie flags, implement session timeout.',
  },

  // ----- Sensitive Data Exposure -----
  {
    id: 'VULN-007',
    category: 'Sensitive Data Exposure',
    name: 'No HTTPS / TLS',
    description: 'Data transmitted in plain text, allowing interception through network sniffing.',
    defaultLikelihood: 4,
    defaultImpact: 4,
    impactExample:
      'Data interception — credentials and sensitive data captured via man-in-the-middle attack.',
    auditChecklistItem:
      'Verify TLS certificate is installed, valid, and HTTPS is enforced on all pages.',
    mitigation:
      'Install valid TLS certificate, enforce HTTPS via HSTS header, redirect all HTTP to HTTPS.',
  },
  {
    id: 'VULN-008',
    category: 'Sensitive Data Exposure',
    name: 'Weak Encryption',
    description: 'System uses outdated or weak cryptographic algorithms to protect sensitive data.',
    defaultLikelihood: 3,
    defaultImpact: 4,
    impactExample:
      'Data decryption — attacker breaks weak encryption to access protected information.',
    auditChecklistItem:
      'Verify that AES-256 or equivalent strong encryption is used for data at rest and in transit.',
    mitigation:
      'Use AES-256 for encryption at rest, TLS 1.3 for transit, deprecate MD5/SHA1/DES algorithms.',
  },
  {
    id: 'VULN-009',
    category: 'Sensitive Data Exposure',
    name: 'Exposed Database Backup',
    description:
      'Database backup files are accessible through web server or publicly available storage.',
    defaultLikelihood: 3,
    defaultImpact: 5,
    impactExample:
      'Complete data breach — attacker downloads full database backup with all records.',
    auditChecklistItem:
      'Verify database backups are stored in secure, non-web-accessible locations with encryption.',
    mitigation:
      'Store backups in encrypted, access-controlled locations outside web root, implement backup monitoring.',
  },

  // ----- Access Control Failures -----
  {
    id: 'VULN-010',
    category: 'Access Control Failures',
    name: 'IDOR (Insecure Direct Object Reference)',
    description:
      'Attacker accesses unauthorized resources by manipulating object identifiers in requests.',
    defaultLikelihood: 4,
    defaultImpact: 4,
    impactExample:
      "Unauthorized data access — attacker views or modifies other users' records by changing IDs.",
    auditChecklistItem:
      'Verify that all object references are validated against user authorization before access.',
    mitigation:
      'Implement server-side authorization checks, use indirect references, validate ownership on every request.',
  },
  {
    id: 'VULN-011',
    category: 'Access Control Failures',
    name: 'Privilege Escalation',
    description:
      'Lower-privileged user gains higher-level access rights through system vulnerabilities.',
    defaultLikelihood: 3,
    defaultImpact: 5,
    impactExample:
      'Admin access — regular user gains administrator privileges and full system control.',
    auditChecklistItem:
      'Verify role-based access controls are enforced server-side and cannot be bypassed via client manipulation.',
    mitigation:
      'Enforce least privilege, validate roles server-side, implement role separation, audit privilege changes.',
  },

  // ----- Security Misconfiguration -----
  {
    id: 'VULN-012',
    category: 'Security Misconfiguration',
    name: 'Default Credentials',
    description:
      'System deployed with factory-default usernames and passwords that are publicly known.',
    defaultLikelihood: 4,
    defaultImpact: 5,
    impactExample:
      'Immediate system compromise — attacker logs in using well-known default credentials.',
    auditChecklistItem:
      'Verify all default credentials have been changed and no default accounts remain active.',
    mitigation:
      'Force password change on first login, disable default accounts, scan for default credentials regularly.',
  },
  {
    id: 'VULN-013',
    category: 'Security Misconfiguration',
    name: 'Directory Listing Enabled',
    description:
      'Web server exposes directory contents, revealing sensitive files and application structure.',
    defaultLikelihood: 3,
    defaultImpact: 3,
    impactExample:
      'Information disclosure — attacker discovers backup files, configuration files, and hidden endpoints.',
    auditChecklistItem: 'Verify directory listing is disabled on all web server directories.',
    mitigation:
      'Disable directory listing in web server config, add index files, configure proper access controls.',
  },
  {
    id: 'VULN-014',
    category: 'Security Misconfiguration',
    name: 'Exposed Admin Panel',
    description:
      'Administrative interface is accessible from the public internet without IP restrictions.',
    defaultLikelihood: 4,
    defaultImpact: 5,
    impactExample:
      'Administrative takeover — attacker finds and brute-forces the admin login panel.',
    auditChecklistItem:
      'Verify admin panel access is restricted by IP allowlist or VPN and not publicly accessible.',
    mitigation:
      'Restrict admin panel to internal network/VPN, implement IP allowlisting, add MFA for admin access.',
  },
  {
    id: 'VULN-015',
    category: 'Security Misconfiguration',
    name: 'Open Unnecessary Ports',
    description: 'Server exposes services on ports that are not required for normal operation.',
    defaultLikelihood: 3,
    defaultImpact: 3,
    impactExample:
      'Attack surface expansion — attacker exploits vulnerable services running on open ports.',
    auditChecklistItem:
      'Verify firewall rules block all unnecessary ports and only required services are exposed.',
    mitigation:
      'Perform port audit, close unnecessary ports, implement firewall rules, run regular port scans.',
  },

  // ----- Cross-Site Attacks -----
  {
    id: 'VULN-016',
    category: 'Cross-Site Attacks',
    name: 'Cross-Site Scripting (XSS)',
    description: 'Attacker injects malicious scripts into web pages viewed by other users.',
    defaultLikelihood: 4,
    defaultImpact: 4,
    impactExample:
      'Account hijacking — attacker steals session cookies and takes over user accounts.',
    auditChecklistItem:
      'Verify all user input is sanitized and output is encoded to prevent script injection.',
    mitigation:
      'Implement output encoding, use Content Security Policy headers, sanitize all user input.',
  },
  {
    id: 'VULN-017',
    category: 'Cross-Site Attacks',
    name: 'Cross-Site Request Forgery (CSRF)',
    description:
      'Attacker tricks authenticated users into executing unwanted actions on the application.',
    defaultLikelihood: 3,
    defaultImpact: 4,
    impactExample:
      'Unauthorized transaction — attacker forces victim to transfer funds or change settings.',
    auditChecklistItem:
      'Verify anti-CSRF tokens are implemented on all state-changing forms and requests.',
    mitigation:
      'Implement CSRF tokens, use SameSite cookie attribute, validate Origin/Referer headers.',
  },

  // ----- Logging & Monitoring Failure -----
  {
    id: 'VULN-018',
    category: 'Logging & Monitoring Failure',
    name: 'No Audit Logs',
    description:
      'System does not record security events, making incident detection and investigation impossible.',
    defaultLikelihood: 3,
    defaultImpact: 4,
    impactExample:
      'Incident undetected — security breaches go unnoticed and uninvestigated for extended periods.',
    auditChecklistItem:
      'Verify comprehensive audit logging is enabled for authentication, authorization, and data access events.',
    mitigation:
      'Implement centralized logging, monitor security events, set up alerting for anomalies, retain logs for 90+ days.',
  },

  // ----- Dependency & Software Issues -----
  {
    id: 'VULN-019',
    category: 'Dependency & Software Issues',
    name: 'Outdated Server Software',
    description:
      'Server runs outdated software versions with known, publicly disclosed vulnerabilities.',
    defaultLikelihood: 4,
    defaultImpact: 4,
    impactExample:
      'Remote exploit — attacker uses publicly available exploit code against unpatched server.',
    auditChecklistItem:
      'Verify all server software is updated to the latest stable version with security patches applied.',
    mitigation:
      'Implement patch management process, enable automatic security updates, subscribe to vulnerability advisories.',
  },
];

export function findVulnerability(id: string): Vulnerability | undefined {
  return VULNERABILITIES.find((v) => v.id === id);
}

export function vulnerabilityCategories(): string[] {
  return [...new Set(VULNERABILITIES.map((v) => v.category))];
}
