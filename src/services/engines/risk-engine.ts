/**
 * Risk engine — pure functions implementing the OCTAVE Allegro risk
 * calculations. No I/O, no DOM: fully unit-testable.
 */
import type { Asset, AssetThreatMap, CiaLevel, Risk } from '@/core/types';
import { findVulnerability } from '@/data/vulnerabilities';

const CIA_WEIGHT: Record<CiaLevel, number> = { High: 3, Medium: 2, Low: 1 };

export interface Criticality {
  level: 'Critical' | 'High' | 'Medium' | 'Low';
  score: number;
}

/** Asset criticality from the sum of its CIA weights (range 3-9). */
export function calcCriticality(
  asset: Pick<Asset, 'confidentiality' | 'integrity' | 'availability'>,
): Criticality {
  const score =
    (CIA_WEIGHT[asset.confidentiality] ?? 1) +
    (CIA_WEIGHT[asset.integrity] ?? 1) +
    (CIA_WEIGHT[asset.availability] ?? 1);
  if (score >= 8) return { level: 'Critical', score };
  if (score >= 6) return { level: 'High', score };
  if (score >= 4) return { level: 'Medium', score };
  return { level: 'Low', score };
}

/**
 * Build the risk register from the asset→vulnerability map. Each selected
 * vulnerability becomes a scored risk (Likelihood × Impact).
 */
export function buildRiskRegister(threats: AssetThreatMap): Risk[] {
  const risks: Risk[] = [];
  for (const [asset, ids] of Object.entries(threats)) {
    for (const id of ids) {
      const v = findVulnerability(id);
      if (!v) continue;
      risks.push({
        asset,
        threat: v.name,
        vulnerability: v.id,
        likelihood: v.defaultLikelihood,
        impact: v.defaultImpact,
        score: v.defaultLikelihood * v.defaultImpact,
        impactDesc: v.impactExample,
        mitigation: v.mitigation,
        category: v.category,
      });
    }
  }
  return risks;
}

/** Count risks per severity band. */
export function riskDistribution(
  risks: Risk[],
): Record<'Critical' | 'High' | 'Medium' | 'Low', number> {
  const dist = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const r of risks) {
    if (r.score >= 16) dist.Critical++;
    else if (r.score >= 10) dist.High++;
    else if (r.score >= 5) dist.Medium++;
    else dist.Low++;
  }
  return dist;
}
