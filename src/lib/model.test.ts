import { describe, expect, it } from "vite-plus/test";
import { analyze, calculate, integrate, relativeError, resistance } from "./model";

describe("модель 4, вариант 10", () => {
  it("интерполирует сопротивление и ограничивает его крайними значениями таблицы", () => {
    expect(resistance(-100)).toBe(0.015);
    expect(resistance(1000)).toBe(0.012);
    expect(resistance(1250)).toBeCloseTo(0.01135, 12);
    expect(resistance(20000)).toBe(0.0016);
  });

  it.each([10, 12])("сохраняет точное решение x₃(t) = 1090 − 35t, T=%s", (t) => {
    const solution = integrate(0.3, t);
    expect(solution.final[2]).toBe(1090 - 35 * t);
    for (const p of solution.points) expect(p.x3).toBeCloseTo(1090 - 35 * p.t, 10);
  });

  it("доходит до T с укороченным последним шагом", () => {
    const solution = integrate(3, 10);
    expect(solution.steps).toBe(4);
    expect(
      solution.points.map((p) => {
        return p.t;
      }),
    ).toEqual([0, 3, 6, 9, 10]);
  });

  it("сходится к независимому эталону RK4 с h=0,0001", () => {
    const solution = integrate(0.01, 10);
    expect(Math.abs(solution.final[0] - 12057.61628545039)).toBeLessThan(0.0001);
    expect(Math.abs(solution.final[1] - 2352.52447529099)).toBeLessThan(0.0001);
  });

  it("считает погрешность относительно h/2 без деления на 15", () => {
    const { solution, comparison } = calculate(1, 10);
    const reference = integrate(0.5, 10);
    const expected =
      (Math.abs(solution.final[0] - reference.final[0]) / Math.abs(reference.final[0])) * 100;
    expect(comparison.error).toBe(expected);
    expect(comparison.reference).toBe(reference.final[0]);
  });

  it("делит h пополам и возвращает первое решение с δ ≤ 1%", () => {
    const result = calculate(11.9, 12, true);
    expect(result.attempts[0]!.error).toBeGreaterThan(1);
    expect(result.solution.step).toBe(5.95);
    expect(result.comparison.error).toBeLessThanOrEqual(1);
    expect(result.solution.final).toEqual(integrate(5.95, 12).final);
  });

  it("не уменьшает шаг, если точность уже достаточна", () => {
    expect(calculate(1, 10, true).solution.step).toBe(1);
  });

  it("ограничивает число точек графика без пропуска шагов интегрирования", () => {
    const result = integrate(0.0005, 10);
    expect(result.steps).toBe(20000);
    expect(result.points.length).toBeLessThanOrEqual(1001);
    expect(result.points[0]!.t).toBe(0);
    expect(result.points.at(-1)!.t).toBe(10);
  });

  it("анализирует 10 пар h и h/2 с правильной трудоёмкостью", () => {
    const rows = analyze(1, 10);
    expect(rows).toHaveLength(10);
    expect(rows[0]!.step).toBe(1 / 512);
    expect(rows[0]!.steps).toBe(5120);
    expect(rows.at(-1)!.step).toBe(1);
    expect(rows.at(-1)!.steps).toBe(10);
  });

  it.each([0, -1, 10, NaN, Infinity, 1e-20])(
    "отклоняет недопустимый или чрезмерно малый шаг %s",
    (h) => {
      expect(() => {
        return calculate(h, 10);
      }).toThrow();
    },
  );

  it("обрабатывает нулевой эталон", () => {
    expect(relativeError(0, 0)).toBe(0);
    expect(relativeError(1, 0)).toBe(Infinity);
  });
});
