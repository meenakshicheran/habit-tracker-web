'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { type HeatmapDay } from '@/lib/hooks/useHabits';

interface HeatmapProps {
  days: HeatmapDay[];
}

const CELL_SIZE = 11;
const CELL_GAP = 2;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const COLS = 53;
const ROWS = 7;
const MONTH_LABEL_HEIGHT = 20;
const DAY_LABEL_WIDTH = 28;

const SVG_WIDTH = COLS * CELL_STEP + DAY_LABEL_WIDTH;
const SVG_HEIGHT = ROWS * CELL_STEP + MONTH_LABEL_HEIGHT;

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function Heatmap({ days }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);

  if (days.length === 0) return null;

  // Build week columns: group 365 days into weeks
  const firstDate = new Date(days[0].date);
  const startDow = firstDate.getDay(); // 0=Sun

  // Pad beginning so week starts on Sunday
  const padded: (HeatmapDay | null)[] = [
    ...Array.from({ length: startDow }, () => null),
    ...days,
  ];

  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // Month label positions
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, colIdx) => {
    const firstReal = week.find((d) => d !== null);
    if (firstReal) {
      const m = new Date(firstReal.date).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: MONTH_NAMES[m], col: colIdx });
        lastMonth = m;
      }
    }
  });

  return (
    <div className="relative overflow-x-auto">
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        className="block"
        style={{ minWidth: SVG_WIDTH }}
      >
        {/* Month labels */}
        {monthLabels.map(({ label, col }) => (
          <text
            key={label + col}
            x={DAY_LABEL_WIDTH + col * CELL_STEP}
            y={MONTH_LABEL_HEIGHT - 6}
            className="fill-[var(--text-muted)]"
            fontSize={9}
          >
            {label}
          </text>
        ))}

        {/* Day labels */}
        {DAY_LABELS.map((label, row) =>
          label ? (
            <text
              key={row}
              x={DAY_LABEL_WIDTH - 4}
              y={MONTH_LABEL_HEIGHT + row * CELL_STEP + CELL_SIZE - 1}
              textAnchor="end"
              className="fill-[var(--text-muted)]"
              fontSize={9}
            >
              {label}
            </text>
          ) : null
        )}

        {/* Cells */}
        {weeks.map((week, colIdx) =>
          week.map((day, rowIdx) => {
            if (!day) return null;
            const x = DAY_LABEL_WIDTH + colIdx * CELL_STEP;
            const y = MONTH_LABEL_HEIGHT + rowIdx * CELL_STEP;
            return (
              <rect
                key={day.date}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                ry={2}
                fill={`var(--heatmap-${day.level})`}
                onMouseEnter={() => setTooltip({ day, x, y })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: day.count > 0 ? 'pointer' : 'default' }}
              />
            );
          })
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: tooltip.x + DAY_LABEL_WIDTH,
            top: tooltip.y - 36,
          }}
        >
          <span className="font-medium">{tooltip.day.count} completion{tooltip.day.count !== 1 ? 's' : ''}</span>
          <span className="text-text-muted"> · {formatDate(tooltip.day.date)}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-text-muted">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span
            key={level}
            style={{ display: 'inline-block', width: 11, height: 11, borderRadius: 2, backgroundColor: `var(--heatmap-${level})`, flexShrink: 0 }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
