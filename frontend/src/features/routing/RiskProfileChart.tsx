import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export interface RiskProfileChartProps {
  data: number[]; // array of risk values along route
  color?: string;
  worstSegment?: { lat: number; lng: number; risk: number; description: string };
}

export const RiskProfileChart: React.FC<RiskProfileChartProps> = ({
  data,
  color = "#2DD4BF",
  worstSegment,
}) => {
  const chartData = data.map((val, idx) => ({
    dist: `${Math.round((idx / (data.length - 1 || 1)) * 100)}%`,
    risk: val,
  }));

  return (
    <div className="w-full space-y-2 select-none">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-text-3 uppercase tracking-wider text-[10px]">
          Risk Profile Along Path
        </span>
        {worstSegment && (
          <span className="text-[11px] font-mono text-danger font-semibold">
            Peak Risk: {worstSegment.risk}%
          </span>
        )}
      </div>

      <div className="w-full h-24 rounded-card overflow-hidden bg-white/5 border border-glass-border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="dist" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-1.5 rounded-md bg-bg-1 border border-glass-border shadow-md text-[10px]">
                      <span className="font-mono font-bold text-text-1">Risk: {payload[0].value}%</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="risk"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#riskGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
