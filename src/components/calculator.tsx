import { useEffect, useRef, useState } from "react";
import { CalculationForm } from "@/components/calculation-form";
import { CalculationSummary } from "@/components/calculation-summary";
import { SolutionCharts } from "@/components/solution-charts";
import { AnalysisCharts } from "@/components/analysis-charts";
import type { Analysis } from "@/components/analysis-charts";
import { Tabs } from "@/components/ui/tabs";
import { TabsContent } from "@/components/ui/tabs-content";
import { TabsList } from "@/components/ui/tabs-list";
import { TabsTrigger } from "@/components/ui/tabs-trigger";
import { calculate, validateInput } from "@/lib/model";
import type { Request, Response } from "@/lib/calculation-worker";

export function Calculator() {
  const [step, setStep] = useState("1");
  const [duration, setDuration] = useState("10");
  const [tab, setTab] = useState("solution");
  const [calculation, setCalculation] = useState(() => {
    return {
      result: calculate(1, 10),
      duration: 10,
    };
  });
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [pendingMode, setPendingMode] = useState<Request["mode"] | null>(null);
  const [error, setError] = useState("");
  const workerRef = useRef<Worker | null>(null);
  const isCalculating = pendingMode !== null;

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  function stopCalculation() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setPendingMode(null);
  }

  function handleCalculation(mode: Request["mode"]) {
    const stepValue = Number(step.replace(",", "."));
    const durationValue = Number(duration);
    try {
      validateInput(stepValue, durationValue);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Проверьте шаг.");
      return;
    }
    stopCalculation();
    setError("");
    setPendingMode(mode);
    const activeWorker = new Worker(new URL("../lib/calculation-worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = activeWorker;
    activeWorker.onmessage = ({ data: response }: MessageEvent<Response>) => {
      if (workerRef.current !== activeWorker) {
        return;
      }
      if (response.type === "error") {
        setError(response.message);
      } else if (response.type === "analysis") {
        setAnalysis({ rows: response.rows, duration: response.duration, step: response.step });
      } else {
        setCalculation({ result: response.result, duration: response.duration });
        setTab("solution");
      }
      stopCalculation();
    };
    activeWorker.onerror = () => {
      if (workerRef.current !== activeWorker) {
        return;
      }
      setError("Не удалось выполнить расчёт. Попробуйте ещё раз.");
      stopCalculation();
    };
    activeWorker.postMessage({ mode, step: stepValue, duration: durationValue } satisfies Request);
  }

  function handleTabChange(value: string) {
    setTab(value);
    if (value === "analysis" && !isCalculating) {
      handleCalculation("analysis");
    }
  }

  const { result, duration: resultDuration } = calculation;

  return (
    <>
      <CalculationForm
        step={step}
        duration={duration}
        pendingMode={pendingMode}
        error={error}
        onStepChange={setStep}
        onDurationChange={setDuration}
        onSubmit={() => {
          handleCalculation(tab === "analysis" ? "analysis" : "manual");
        }}
        onAuto={() => {
          handleCalculation("auto");
        }}
        onCancel={stopCalculation}
      />

      {error && (
        <p id="calculation-error" role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <CalculationSummary result={result} duration={resultDuration} isCalculating={isCalculating} />

      <Tabs value={tab} onValueChange={handleTabChange} className="mt-7 gap-8">
        <TabsList variant="line" className="gap-5 p-0">
          <TabsTrigger value="solution" className="px-0">
            Решение
          </TabsTrigger>
          <TabsTrigger value="analysis" className="px-0">
            Точность и трудоёмкость
          </TabsTrigger>
        </TabsList>
        <TabsContent value="solution" className="space-y-6">
          <SolutionCharts solution={result.solution} duration={resultDuration} />
        </TabsContent>
        <TabsContent value="analysis" className="space-y-6" aria-busy={pendingMode === "analysis"}>
          <AnalysisCharts analysis={analysis} isCalculating={isCalculating} />
        </TabsContent>
      </Tabs>
    </>
  );
}
