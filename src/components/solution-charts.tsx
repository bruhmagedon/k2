import { Plot } from "@/components/plot";
import { format } from "@/lib/format";
import type { Solution } from "@/lib/model";

interface SolutionChartsProps {
  solution: Solution;
  duration: number;
}

export function SolutionCharts({ solution, duration }: SolutionChartsProps) {
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Рунге — Кутта 4 <span className="mx-2 text-border">/</span> T = {duration} с{" "}
        <span className="mx-2 text-border">/</span> Эталон: h/2 = {format(solution.step / 2)} с
      </p>
      <div className="grid gap-9 lg:grid-cols-3 lg:gap-6">
        <Plot title="x₁ · Высота" unit="м" data={solution.points} valueKey="x1" />
        <Plot
          title="x₂ · Скорость"
          unit="м/с"
          data={solution.points}
          valueKey="x2"
          color="var(--chart-2)"
        />
        <Plot
          title="x₃ · Масса"
          unit="кг"
          data={solution.points}
          valueKey="x3"
          color="var(--chart-3)"
        />
      </div>
    </>
  );
}
