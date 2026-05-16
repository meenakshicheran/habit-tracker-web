'use client';

import { motion } from 'framer-motion';

interface WeekData {
  week: number;
  count: number;
  rate: number;
}

interface WeeklyChartProps {
  data: WeekData[];
}

const WIDTH = 400;
const HEIGHT = 160;
const PADDING = { top: 10, right: 10, bottom: 30, left: 30 };
const CHART_W = WIDTH - PADDING.left - PADDING.right;
const CHART_H = HEIGHT - PADDING.top - PADDING.bottom;

export function WeeklyChart({ data }: WeeklyChartProps) {
  if (data.length === 0) return null;

  const barCount = data.length;
  const barW = Math.min(36, (CHART_W / barCount) * 0.55);
  const gap = CHART_W / barCount;

  const gridLines = [25, 50, 75, 100];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: HEIGHT, minWidth: 280 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {gridLines.map((pct) => {
          const y = PADDING.top + CHART_H - (pct / 100) * CHART_H;
          return (
            <g key={pct}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + CHART_W}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 5"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={8}
                fill="var(--text-muted)"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max(2, (d.rate / 100) * CHART_H);
          const x = PADDING.left + i * gap + gap / 2 - barW / 2;
          const y = PADDING.top + CHART_H - barH;
          const label = `W${d.week}`;

          return (
            <g key={d.week}>
              <defs>
                <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.15 + (d.rate / 100) * 0.85} />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity={0.1 + (d.rate / 100) * 0.6} />
                </linearGradient>
              </defs>
              <motion.rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                ry={6}
                fill={`url(#bar-grad-${i})`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                style={{ transformOrigin: `${x + barW / 2}px ${PADDING.top + CHART_H}px` }}
              />
              <text
                x={x + barW / 2}
                y={PADDING.top + CHART_H + 16}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-muted)"
              >
                {label}
              </text>
              {d.rate > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 3}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--text-secondary)"
                >
                  {d.rate}%
                </text>
              )}
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + CHART_H}
          x2={PADDING.left + CHART_W}
          y2={PADDING.top + CHART_H}
          stroke="var(--border)"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
