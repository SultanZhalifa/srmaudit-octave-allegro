/** Dashboard charts (risk distribution doughnut, compliance bar). */
import type { ChecklistItem, Risk } from '@/core/types';
import { renderChart, cssVar } from '@/ui/chart';
import { riskDistribution } from '@/services/engines/risk-engine';

export function drawDashboardCharts(risks: Risk[], checklist: ChecklistItem[]): void {
  if (risks.length > 0) {
    const dist = riskDistribution(risks);
    const total = risks.length;
    renderChart<'doughnut'>('riskPie', {
      type: 'doughnut',
      data: {
        labels: Object.keys(dist),
        datasets: [
          {
            data: Object.values(dist),
            backgroundColor: [
              cssVar('--critical'),
              cssVar('--high'),
              cssVar('--medium'),
              cssVar('--low'),
            ],
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } },
          },
        },
      },
      plugins: [
        {
          id: 'center',
          beforeDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            const { left, top, width, height } = chartArea;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '800 1.6rem Sora';
            ctx.fillStyle = cssVar('--text-primary');
            ctx.fillText(String(total), left + width / 2, top + height / 2 - 6);
            ctx.font = '600 0.6rem Inter';
            ctx.fillStyle = cssVar('--text-muted');
            ctx.fillText('TOTAL RISKS', left + width / 2, top + height / 2 + 14);
            ctx.restore();
          },
        },
      ],
    });
  }

  if (checklist.length > 0) {
    const map: Record<string, string> = {
      compliant: 'Compliant',
      partially: 'Partial',
      'non-compliant': 'Non-Compliant',
      pending: 'Pending',
      na: 'N/A',
    };
    const counts: Record<string, number> = {
      Compliant: 0,
      Partial: 0,
      'Non-Compliant': 0,
      Pending: 0,
      'N/A': 0,
    };
    for (const c of checklist) {
      const label = map[c.status] ?? 'Pending';
      counts[label] = (counts[label] ?? 0) + 1;
    }
    renderChart<'bar'>('compBar', {
      type: 'bar',
      data: {
        labels: Object.keys(counts),
        datasets: [
          {
            data: Object.values(counts),
            backgroundColor: [
              cssVar('--success'),
              cssVar('--warning'),
              cssVar('--danger'),
              cssVar('--text-muted'),
              cssVar('--info'),
            ],
            borderRadius: 6,
            barThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { color: cssVar('--border-soft') },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }
}
