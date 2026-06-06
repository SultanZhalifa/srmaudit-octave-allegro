/**
 * Exposure engine — computes an organization's inherent exposure (1-10) from
 * its sector, size and primary system type. Pure and unit-testable.
 */
import type { Organization } from '@/core/types';
import type { IconName } from '@/ui/icons';

export interface Exposure {
  level: 'Critical' | 'High' | 'Medium' | 'Low' | 'Unknown';
  score: number;
  icon: IconName;
  color: string;
  bg: string;
  description: string;
}

const SECTOR_RISK: Record<string, number> = {
  Finance: 3,
  Healthcare: 3,
  Government: 3,
  Education: 2,
  Technology: 2,
  Retail: 1,
  Manufacturing: 1,
  Other: 1,
};

const EMPLOYEE_RISK: Record<string, number> = {
  '1-50': 1,
  '51-200': 2,
  '201-1000': 3,
  '1000+': 4,
};

const SYSTEM_RISK: Record<string, number> = {
  'Cloud Infrastructure': 3,
  'Web Application': 3,
  'Mobile Application': 2,
  Hybrid: 3,
  'Internal Network': 1,
};

export function calcExposure(org: Organization): Exposure {
  if (!org.name) {
    return {
      level: 'Unknown',
      score: 0,
      icon: 'circle-help',
      color: 'var(--text-muted)',
      bg: 'var(--bg-sunken)',
      description: '',
    };
  }
  const score =
    (SECTOR_RISK[org.sector ?? ''] ?? 1) +
    (EMPLOYEE_RISK[org.employees ?? ''] ?? 1) +
    (SYSTEM_RISK[org.system ?? ''] ?? 1);

  if (score >= 8)
    return {
      level: 'Critical',
      score,
      icon: 'shield-alert',
      color: 'var(--critical)',
      bg: 'var(--critical-bg)',
      description:
        'Very high exposure. A comprehensive security programme is required immediately.',
    };
  if (score >= 6)
    return {
      level: 'High',
      score,
      icon: 'flame',
      color: 'var(--high)',
      bg: 'var(--high-bg)',
      description: 'Significant exposure. Robust controls and continuous monitoring are needed.',
    };
  if (score >= 4)
    return {
      level: 'Medium',
      score,
      icon: 'alert-triangle',
      color: 'var(--medium)',
      bg: 'var(--medium-bg)',
      description: 'Moderate exposure. Standard security measures with periodic review.',
    };
  return {
    level: 'Low',
    score,
    icon: 'shield-check',
    color: 'var(--low)',
    bg: 'var(--low-bg)',
    description: 'Lower exposure. Baseline security controls are generally sufficient.',
  };
}
