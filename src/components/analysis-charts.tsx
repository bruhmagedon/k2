import { Plot } from "@/components/plot";
import { format } from "@/lib/format";
import type { Comparison } from "@/lib/model";

export interface Analysis {
  rows: Comparison[];
  duration: number;
  step: number;
}

interface AnalysisChartsProps {
  analysis: Analysis | null;
  isCalculating: boolean;
}

export function AnalysisCharts({ analysis, isCalculating }: AnalysisChartsProps) {
  if (!analysis) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {isCalculating ? "Расчёт…" : "Нажмите «Рассчитать»."}
      </p>
    );
  }

  return (
    <>
      <p className="text-xs text-muted-foreground">
        T = {analysis.duration} с <span className="mx-2 text-border">/</span> h₀ ={" "}
        {format(analysis.step)} с <span className="mx-2 text-border">/</span> 10 последовательных
        делений шага пополам
      </p>
      <div className="grid gap-9 lg:grid-cols-2 lg:gap-10">
        <Plot
          title="δ(h) · Погрешность"
          unit="%"
          data={analysis.rows}
          valueKey="error"
          analysis
          threshold
        />
        <Plot
          title="J(h) · Трудоёмкость"
          unit="шагов"
          data={analysis.rows}
          valueKey="steps"
          color="var(--chart-2)"
          analysis
        />
      </div>
    </>
  );
}
