/** OCTAVE Allegro risk severity bands and classification. */
import type { RiskLevel } from '@/core/types';

interface RiskLevelSet {
  CRITICAL: RiskLevel;
  HIGH: RiskLevel;
  MEDIUM: RiskLevel;
  LOW: RiskLevel;
}

export const RISK_LEVELS: RiskLevelSet = {
  CRITICAL: { label: 'Critical', min: 16, max: 25 },
  HIGH: { label: 'High', min: 10, max: 15 },
  MEDIUM: { label: 'Medium', min: 5, max: 9 },
  LOW: { label: 'Low', min: 1, max: 4 },
};

/** Classify a 1-25 risk score into its severity band. */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= RISK_LEVELS.CRITICAL.min) return RISK_LEVELS.CRITICAL;
  if (score >= RISK_LEVELS.HIGH.min) return RISK_LEVELS.HIGH;
  if (score >= RISK_LEVELS.MEDIUM.min) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

/** Lowercase severity used as a CSS modifier class. */
export function riskClass(score: number): string {
  return getRiskLevel(score).label.toLowerCase();
}
