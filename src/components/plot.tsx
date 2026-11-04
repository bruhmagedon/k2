import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "@/lib/format";
import type { Comparison, Point } from "@/lib/model";

interface PlotProps {
  title: string;
  unit: string;
  data: (Point | Comparison)[];
  valueKey: "x1" | "x2" | "x3" | "error" | "steps";
  color?: string;
  analysis?: boolean;
  threshold?: boolean;
}

export function Plot({
  title,
  unit,
  data,
  valueKey,
  color = "var(--chart-1)",
  analysis = false,
  threshold = false,
}: PlotProps) {
  return (
    <section className="min-w-0" aria-label={title}>
      <div className="mb-5 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="h-64 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 6 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
            <XAxis
              dataKey={analysis ? "step" : "t"}
              type="number"
              scale={analysis ? "log" : "linear"}
              domain={["dataMin", "dataMax"]}
              tickFormatter={format}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
              tickMargin={12}
              label={{
                value: analysis ? "h, с" : "t, с",
                position: "insideBottomRight",
                offset: -3,
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            <YAxis
              width={66}
              domain={valueKey === "x3" ? ["dataMin", "dataMax"] : [0, "auto"]}
              tickFormatter={format}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickCount={5}
              tickMargin={8}
            />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--muted-foreground)", marginBottom: 6 }}
              labelFormatter={(label) => `${analysis ? "h" : "t"} = ${format(Number(label))} с`}
              formatter={(value) => [`${format(Number(value))} ${unit}`, title]}
            />
            {threshold &&
              Math.max(...data.map((point) => ("error" in point ? point.error : 0))) >= 0.1 && (
                <ReferenceLine
                  y={1}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  label={{
                    value: "1%",
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                    position: "insideTopRight",
                  }}
                  ifOverflow="extendDomain"
                />
              )}
            <Line
              type="linear"
              dataKey={valueKey}
              name={title}
              stroke={color}
              strokeWidth={1.8}
              dot={analysis ? { r: 2.5, fill: color, strokeWidth: 0 } : false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
