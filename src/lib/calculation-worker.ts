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
    const response: Response =
      data.mode === "analysis"
        ? {
            type: "analysis",
            rows: analyze(data.step, data.duration),
            duration: data.duration,
            step: data.step,
          }
        : {
            type: "calculation",
            result: calculate(data.step, data.duration, data.mode === "auto"),
            duration: data.duration,
          };
    self.postMessage(response);
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Не удалось выполнить расчёт.",
    } satisfies Response);
  }
};
