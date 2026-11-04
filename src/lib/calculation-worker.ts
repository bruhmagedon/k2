import { analyze, calculate } from "./model";
import type { Calculation, Comparison } from "./model";

export interface Request {
  mode: "manual" | "auto" | "analysis";
  step: number;
  duration: number;
}

export type Response =
  | { type: "calculation"; result: Calculation; duration: number }
  | { type: "analysis"; rows: Comparison[]; duration: number; step: number }
  | { type: "error"; message: string };

self.onmessage = ({ data }: MessageEvent<Request>) => {
  try {
    const { mode, step, duration } = data;
    const response: Response =
      mode === "analysis"
        ? {
            type: "analysis",
            rows: analyze(step, duration),
            duration,
            step,
          }
        : {
            type: "calculation",
            result: calculate(step, duration, mode === "auto"),
            duration,
          };
    self.postMessage(response);
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Не удалось выполнить расчёт.",
    } satisfies Response);
  }
};
