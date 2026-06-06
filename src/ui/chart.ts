/**
 * Chart.js helper. Registers the chart instance by canvas id so re-renders
 * destroy the previous instance (prevents leaks), and resolves CSS variables
 * for theme-aware colors.
 */
import { Chart, type ChartConfiguration, type ChartType } from 'chart.js/auto';

const instances = new Map<string, Chart>();

export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function renderChart<T extends ChartType>(
  canvasId: string,
  config: ChartConfiguration<T>,
): Chart<T> | null {
  const existing = instances.get(canvasId);
  if (existing) {
    existing.destroy();
    instances.delete(canvasId);
  }
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return null;
  Chart.defaults.font.family = 'Inter';
  Chart.defaults.color = cssVar('--text-muted');
  const chart = new Chart(canvas, config) as Chart<T>;
  instances.set(canvasId, chart as unknown as Chart);
  return chart;
}

export function destroyChart(canvasId: string): void {
  instances.get(canvasId)?.destroy();
  instances.delete(canvasId);
}
