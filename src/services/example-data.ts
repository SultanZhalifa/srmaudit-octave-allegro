/**
 * Worked example dataset (President University scenario). Loaded explicitly by
 * the user to explore every module — clearly sample data, not silent fake state.
 */
import type { Asset, AssetThreatMap, ChecklistItem, ControlStatus } from '@/core/types';
import { findVulnerability } from '@/data/vulnerabilities';
import { getFramework } from '@/data/frameworks';
import { buildRiskRegister } from './engines/risk-engine';
import { generateFindings } from './engines/findings-engine';
import { backend } from './backend';

const ASSETS: Asset[] = [
  {
    name: 'Student Information System',
    owner: 'IT Department',
    type: 'Application',
    location: 'Cloud Server',
    description: 'Core academic system for student records, grades and enrolment',
    confidentiality: 'High',
    integrity: 'High',
    availability: 'High',
    containers: ['Web Server', 'Cloud Storage', 'Database Server'],
  },
  {
    name: 'Learning Management System',
    owner: 'Academic Affairs',
    type: 'Application',
    location: 'Cloud Server',
    description: 'E-learning platform for courses and assignments',
    confidentiality: 'Medium',
    integrity: 'High',
    availability: 'High',
    containers: ['Web Server', 'File Server'],
  },
  {
    name: 'Email Server',
    owner: 'IT Department',
    type: 'Server',
    location: 'Hybrid',
    description: 'University email for staff and students',
    confidentiality: 'High',
    integrity: 'Medium',
    availability: 'High',
    containers: ['Database Server', 'Backup Tapes'],
  },
  {
    name: 'Financial Records Database',
    owner: 'Finance Department',
    type: 'Data',
    location: 'On-Premise',
    description: 'Tuition payments, payroll and budget data',
    confidentiality: 'High',
    integrity: 'High',
    availability: 'Medium',
    containers: ['Database Server', 'Backup Tapes'],
  },
  {
    name: 'Campus Wi-Fi Network',
    owner: 'IT Infrastructure',
    type: 'Network',
    location: 'On-Premise',
    description: 'Wireless network infrastructure for the campus',
    confidentiality: 'Low',
    integrity: 'Medium',
    availability: 'High',
    containers: ['Network Device'],
  },
];

const THREATS: AssetThreatMap = {
  'Student Information System': ['VULN-001', 'VULN-003', 'VULN-010', 'VULN-016'],
  'Learning Management System': ['VULN-002', 'VULN-005', 'VULN-017'],
  'Email Server': ['VULN-004', 'VULN-008', 'VULN-011'],
  'Financial Records Database': ['VULN-001', 'VULN-006', 'VULN-009'],
  'Campus Wi-Fi Network': ['VULN-007', 'VULN-015'],
};

export function loadExampleData(): void {
  const repo = backend.repo;

  repo.set('organization', {
    name: 'President University',
    sector: 'Education',
    employees: '201-1000',
    system: 'Web Application',
  });
  repo.set('assets', ASSETS);
  repo.set('assetThreats', THREATS);
  repo.set('riskCriteria', {
    reputation: {
      low: 'Minor mention',
      med: 'Local media coverage',
      high: 'National negative publicity',
    },
    financial: { low: 'Under $10K', med: '$10K–$100K', high: 'Over $100K' },
    productivity: { low: '< 1 hour', med: '1–24 hours', high: '> 24 hours' },
    safety: { low: 'No injuries', med: 'Minor incident', high: 'Serious safety threat' },
    legal: { low: 'Policy violation', med: 'Regulatory fine', high: 'Lawsuit or investigation' },
  });

  const risks = buildRiskRegister(THREATS);
  repo.set('risks', risks);

  const statuses: ControlStatus[] = [
    'compliant',
    'compliant',
    'partially',
    'non-compliant',
    'compliant',
    'partially',
    'compliant',
    'non-compliant',
    'compliant',
    'compliant',
  ];
  const checklist: ChecklistItem[] = [];
  const seen = new Set<string>();
  let si = 0;
  for (const ids of Object.values(THREATS)) {
    for (const id of ids) {
      const v = findVulnerability(id);
      if (!v || seen.has(v.id)) continue;
      seen.add(v.id);
      checklist.push({
        title: v.auditChecklistItem,
        description: `${v.name} (${v.category}) — ${getFramework(v.category).iso}`,
        source: v.name,
        status: statuses[si % statuses.length] ?? 'pending',
        notes: '',
      });
      si++;
    }
  }
  checklist.push(
    {
      title: 'Verify an incident response plan exists and is tested annually.',
      description: 'OCTAVE Allegro baseline control',
      source: 'OCTAVE Allegro',
      status: 'compliant',
      notes: 'Tested Jan 2026',
    },
    {
      title: 'Verify data backup procedures are documented and tested.',
      description: 'OCTAVE Allegro baseline control',
      source: 'OCTAVE Allegro',
      status: 'partially',
      notes: 'Documented, not tested this quarter',
    },
    {
      title: 'Verify security awareness training is provided to all staff.',
      description: 'OCTAVE Allegro baseline control',
      source: 'OCTAVE Allegro',
      status: 'non-compliant',
      notes: 'No training in 2025',
    },
    {
      title: 'Verify access control policies are defined and enforced.',
      description: 'OCTAVE Allegro baseline control',
      source: 'OCTAVE Allegro',
      status: 'compliant',
      notes: '',
    },
    {
      title: 'Verify a change management process governs system updates.',
      description: 'OCTAVE Allegro baseline control',
      source: 'OCTAVE Allegro',
      status: 'partially',
      notes: 'Informal process',
    },
  );
  repo.set('auditChecklist', checklist);
  repo.set('findings', generateFindings(risks, checklist));

  const now = new Date();
  const fmt = (off: number) =>
    new Date(now.getTime() - off * 60000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }) +
    ' · ' +
    now.toLocaleDateString();
  repo.set('activityLog', [
    {
      action: 'Example Loaded',
      detail: 'President University scenario populated',
      color: 'accent',
      time: fmt(0),
    },
    {
      action: 'Findings Generated',
      detail: `${repo.get('findings').length} findings`,
      color: 'danger',
      time: fmt(1),
    },
    {
      action: 'Checklist Generated',
      detail: `${checklist.length} controls`,
      color: 'warning',
      time: fmt(2),
    },
    {
      action: 'Risk Assessment',
      detail: `${risks.length} risks across 5 assets`,
      color: 'high',
      time: fmt(3),
    },
    { action: 'Assets Registered', detail: '5 information assets', color: 'success', time: fmt(4) },
    { action: 'Organization Saved', detail: 'President University', color: 'accent', time: fmt(5) },
  ]);
}
