import { Metric } from "@/components/metric";
import { format } from "@/lib/format";
import type { Calculation } from "@/lib/model";

interface CalculationSummaryProps {
  result: Calculation;
  duration: number;
  isCalculating: boolean;
}

export function CalculationSummary({ result, duration, isCalculating }: CalculationSummaryProps) {
  const { solution, comparison } = result;

  return (
    <dl
      className="grid grid-cols-2 gap-x-6 gap-y-6 border-b py-7 sm:grid-cols-4"
      aria-live="polite"
      aria-busy={isCalculating}
    >
      <Metric label={`x₁(${duration}), м`} value={format(solution.final[0])} />
      <Metric
        label="Погрешность δ"
        value={`${format(comparison.error)} %`}
        isError={comparison.error > 1}
      />
      <Metric label="Шаг h, с" value={format(solution.step)} />
      <Metric label="Шагов J" value={format(solution.steps)} />
    </dl>
  );
}
