import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SelectContent } from "@/components/ui/select-content";
import { SelectItem } from "@/components/ui/select-item";
import { SelectTrigger } from "@/components/ui/select-trigger";
import { SelectValue } from "@/components/ui/select-value";
import { cn } from "@/lib/utils";
import type { Request } from "@/lib/calculation-worker";

interface CalculationFormProps {
  step: string;
  duration: string;
  pendingMode: Request["mode"] | null;
  error: string;
  onStepChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onSubmit: () => void;
  onAuto: () => void;
  onCancel: () => void;
}

export function CalculationForm({
  step,
  duration,
  pendingMode,
  error,
  onStepChange,
  onDurationChange,
  onSubmit,
  onAuto,
  onCancel,
}: CalculationFormProps) {
  const isCalculating = pendingMode !== null;
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (!isCalculating) {
      setShowProgress(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowProgress(true);
    }, 200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isCalculating]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isCalculating) {
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-wrap items-end gap-3 border-y py-5"
      aria-busy={isCalculating}
    >
      <div className="grid gap-2">
        <Label htmlFor="step" className="text-xs text-muted-foreground">
          Шаг h, с
        </Label>
        <Input
          id="step"
          inputMode="decimal"
          value={step}
          onChange={(event) => {
            onStepChange(event.target.value);
          }}
          className="w-32 font-mono disabled:opacity-100"
          aria-invalid={!!error}
          aria-describedby={error ? "calculation-error" : undefined}
          disabled={isCalculating}
          autoComplete="off"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="duration" className="text-xs text-muted-foreground">
          Интервал T, с
        </Label>
        <Select value={duration} onValueChange={onDurationChange} disabled={isCalculating}>
          <SelectTrigger id="duration" className="w-28 font-mono disabled:opacity-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="12">12</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2 sm:ml-auto">
        <Button type="submit" variant="outline" aria-disabled={isCalculating}>
          Рассчитать
        </Button>
        <Button
          type="button"
          aria-disabled={isCalculating}
          onClick={() => {
            if (!isCalculating) {
              onAuto();
            }
          }}
        >
          Подобрать ≤ 1%
        </Button>
      </div>
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex h-5 items-center justify-between text-xs text-muted-foreground",
          !(isCalculating && showProgress) && "hidden",
        )}
      >
        <span role="status">{pendingMode === "auto" ? "Подбор шага…" : "Расчёт…"}</span>
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-5 px-0 text-xs text-muted-foreground"
          onClick={onCancel}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
