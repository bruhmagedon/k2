import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plot } from "@/components/plot";
import { format } from "@/lib/format";
import { calculate, validateInput } from "@/lib/model";
import type { Comparison } from "@/lib/model";
import type { Request, Response } from "@/lib/calculation-worker";

interface Analysis {
  rows: Comparison[];
  duration: number;
  step: number;
}

export default function App() {
  const [step, setStep] = useState("1");
  const [duration, setDuration] = useState("10");
  const [tab, setTab] = useState("solution");
  const [calculation, setCalculation] = useState(() => ({
    result: calculate(1, 10),
    duration: 10,
  }));
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState<Request["mode"] | null>(null);
  const [error, setError] = useState("");
  const worker = useRef<Worker | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  function cancel() {
    worker.current?.terminate();
    worker.current = null;
    setBusy(null);
  }

  function run(mode: Request["mode"]) {
    const h = Number(step.replace(",", "."));
    const t = Number(duration);
    try {
      validateInput(h, t);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Проверьте шаг.");
      return;
    }
    cancel();
    setError("");
    setBusy(mode);
    const current = new Worker(new URL("./lib/calculation-worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = current;
    current.onmessage = ({ data }: MessageEvent<Response>) => {
      if (worker.current !== current) return;
      if (data.type === "error") {
        setError(data.message);
      } else if (data.type === "analysis") {
        setAnalysis({ rows: data.rows, duration: data.duration, step: data.step });
      } else {
        setCalculation({ result: data.result, duration: data.duration });
        setTab("solution");
      }
      cancel();
    };
    current.onerror = () => {
      if (worker.current !== current) return;
      setError("Не удалось выполнить расчёт. Попробуйте ещё раз.");
      cancel();
    };
    current.postMessage({ mode, step: h, duration: t } satisfies Request);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(tab === "analysis" ? "analysis" : "manual");
  }

  function changeTab(value: string) {
    setTab(value);
    if (value === "analysis" && !busy) run("analysis");
  }

  const { result, duration: resultDuration } = calculation;
  const { solution, comparison } = result;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-10 sm:py-16">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3 border-y py-5">
        <div className="grid gap-2">
          <Label htmlFor="step" className="text-xs text-muted-foreground">
            Шаг h, с
          </Label>
          <Input
            id="step"
            inputMode="decimal"
            value={step}
            onChange={(event) => setStep(event.target.value)}
            className="w-32 font-mono"
            aria-invalid={!!error}
            aria-describedby={error ? "calculation-error" : undefined}
            disabled={!!busy}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="duration" className="text-xs text-muted-foreground">
            Интервал T, с
          </Label>
          <Select value={duration} onValueChange={setDuration} disabled={!!busy}>
            <SelectTrigger id="duration" className="w-28 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="12">12</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {busy ? (
            <>
              <span
                role="status"
                className="flex h-9 items-center gap-2 px-2 text-sm text-muted-foreground"
              >
                <span className="size-1.5 animate-pulse bg-primary motion-reduce:animate-none" />
                {busy === "auto" ? "Подбор шага…" : "Расчёт…"}
              </span>
              <Button type="button" variant="outline" onClick={cancel}>
                Отмена
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" variant="outline">
                Рассчитать
              </Button>
              <Button type="button" onClick={() => run("auto")}>
                Подобрать ≤ 1%
              </Button>
            </>
          )}
        </div>
      </form>

      {error && (
        <p id="calculation-error" role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <dl
        className="grid grid-cols-2 gap-x-6 gap-y-6 border-b py-7 sm:grid-cols-4"
        aria-live="polite"
        aria-busy={!!busy}
      >
        <Metric label={`x₁(${resultDuration}), м`} value={format(solution.final[0])} />
        <Metric
          label="Погрешность δ"
          value={`${format(comparison.error)} %`}
          bad={comparison.error > 1}
        />
        <Metric label="Шаг h, с" value={format(solution.step)} />
        <Metric label="Шагов J" value={format(solution.steps)} />
      </dl>

      <Tabs value={tab} onValueChange={changeTab} className="mt-7 gap-8">
        <TabsList variant="line" className="gap-5 p-0">
          <TabsTrigger value="solution" className="px-0">
            Решение
          </TabsTrigger>
          <TabsTrigger value="analysis" className="px-0">
            Точность и трудоёмкость
          </TabsTrigger>
        </TabsList>
        <TabsContent value="solution" className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Рунге — Кутта 4 <span className="mx-2 text-border">/</span> T = {resultDuration} с{" "}
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
        </TabsContent>
        <TabsContent value="analysis" className="space-y-6" aria-busy={busy === "analysis"}>
          {analysis ? (
            <>
              <p className="text-xs text-muted-foreground">
                T = {analysis.duration} с <span className="mx-2 text-border">/</span> h₀ ={" "}
                {format(analysis.step)} с <span className="mx-2 text-border">/</span> 10
                последовательных делений шага пополам
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
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {busy ? "Расчёт…" : "Нажмите «Рассчитать»."}
            </p>
          )}
        </TabsContent>
      </Tabs>

      <details className="mt-9 border-t pt-5 text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer py-1 outline-offset-4 hover:text-foreground">
          Уравнения и параметры
        </summary>
        <div className="mt-4 grid gap-4 leading-6 sm:grid-cols-2">
          <p className="font-mono">
            x₁′ = x₂
            <br />
            x₂′ = (c·u − r(x₁)·x₂²) / x₃ − g<br />
            x₃′ = −u
          </p>
          <p>
            c = 6500 · u = 35 · g = 9,81
            <br />
            X(0) = (1000; 0; 1090)
            <br />
            r(x₁) — линейная интерполяция таблицы 5
          </p>
          <p>δ = |x₁(T; h) − x₁(T; h/2)| / |x₁(T; h/2)| · 100%</p>
          <p>T = 10 с — общее задание; 12 с — таблица варианта.</p>
        </div>
      </details>
    </main>
  );
}

function Metric({ label, value, bad = false }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="mb-2 text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`break-words font-mono text-xl tabular-nums tracking-tight sm:text-2xl ${bad ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}
