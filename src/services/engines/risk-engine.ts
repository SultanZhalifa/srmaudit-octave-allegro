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

export const RATING_MIN = 1;
export const RATING_MAX = 5;

/** A whole number from 1 to 5; anything else keeps the `fallback`. */
function clampRating(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(value)));
}

const riskKey = (asset: string, vulnerability: string): string => `${asset}\u0000${vulnerability}`;

/**
 * Build the risk register from the asset→vulnerability map. Each selected
 * vulnerability becomes a scored risk (Likelihood × Impact). It starts from the
 * catalogue's default ratings. Pass the previous register so that ratings the user
 * has set (`rated`) survive running the assessment again.
 */
export function buildRiskRegister(threats: AssetThreatMap, previous: Risk[] = []): Risk[] {
  const mine = new Map(
    previous.filter((r) => r.rated).map((r) => [riskKey(r.asset, r.vulnerability), r]),
  );
  const risks: Risk[] = [];
  for (const [asset, ids] of Object.entries(threats)) {
    for (const id of ids) {
      const v = findVulnerability(id);
      if (!v) continue;
      const kept = mine.get(riskKey(asset, v.id));
      const likelihood = kept
        ? clampRating(kept.likelihood, v.defaultLikelihood)
        : v.defaultLikelihood;
      const impact = kept ? clampRating(kept.impact, v.defaultImpact) : v.defaultImpact;
      risks.push({
        asset,
        threat: v.name,
        vulnerability: v.id,
        likelihood,
        impact,
        score: likelihood * impact,
        ...(kept ? { rated: true } : {}),
        impactDesc: v.impactExample,
        mitigation: v.mitigation,
        category: v.category,
      });
    }
  }
  return risks;
}

/** The risk with the user's likelihood and impact (each 1 to 5) and the score worked out again. */
export function rateRisk(risk: Risk, likelihood: number, impact: number): Risk {
  const l = clampRating(likelihood, risk.likelihood);
  const i = clampRating(impact, risk.impact);
  return { ...risk, likelihood: l, impact: i, score: l * i, rated: true };
}

/** The risk back at the catalogue's default ratings. */
export function resetRating(risk: Risk): Risk {
  const v = findVulnerability(risk.vulnerability);
  if (!v) return risk;
  const { rated: _rated, ...rest } = risk;
  return {
    ...rest,
    likelihood: v.defaultLikelihood,
    impact: v.defaultImpact,
    score: v.defaultLikelihood * v.defaultImpact,
  };
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
