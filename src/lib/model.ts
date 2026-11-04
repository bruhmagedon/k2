export type State = [height: number, velocity: number, mass: number];

export interface Point {
  t: number;
  x1: number;
  x2: number;
  x3: number;
}

export interface Solution {
  step: number;
  steps: number;
  final: State;
  points: Point[];
}

export interface Comparison {
  step: number;
  steps: number;
  error: number;
  reference: number;
}

export interface Calculation {
  solution: Solution;
  comparison: Comparison;
  attempts: Comparison[];
}

// Модель 4, вариант 10. Таблица 4; h_тв не используется в чётном варианте.
export const MODEL = {
  c: 6500,
  u: 35,
  g: 9.81,
  initial: [1000, 0, 1090] as State,
};

const RESISTANCE = [
  0.015, 0.0135, 0.012, 0.0107, 0.0096, 0.0088, 0.0077, 0.0069, 0.0061, 0.0055, 0.0049, 0.0044,
  0.0039, 0.0035, 0.0031, 0.0028, 0.0025, 0.0022, 0.002, 0.0018, 0.0016,
];

export function resistance(height: number): number {
  if (height <= 0) return RESISTANCE[0]!;
  if (height >= 10000) return RESISTANCE[20]!;
  const index = Math.floor(height / 500);
  const fraction = (height - index * 500) / 500;
  return RESISTANCE[index]! + fraction * (RESISTANCE[index + 1]! - RESISTANCE[index]!);
}

function acceleration(height: number, velocity: number, mass: number): number {
  return (MODEL.c * MODEL.u - resistance(height) * velocity * velocity) / mass - MODEL.g;
}

// Все промежуточные состояния связаны: r пересчитывается на каждой стадии RK4.
export function rk4Step([x, v, m]: State, h: number): State {
  const half = h / 2;
  const a1 = acceleration(x, v, m);
  const v2 = v + half * a1;
  const a2 = acceleration(x + half * v, v2, m - half * MODEL.u);
  const v3 = v + half * a2;
  const a3 = acceleration(x + half * v2, v3, m - half * MODEL.u);
  const v4 = v + h * a3;
  const a4 = acceleration(x + h * v3, v4, m - h * MODEL.u);

  return [
    x + (h / 6) * (v + 2 * v2 + 2 * v3 + v4),
    v + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4),
    m - h * MODEL.u,
  ];
}

export function relativeError(value: number, reference: number): number {
  if (reference === 0) return value === 0 ? 0 : Infinity;
  return (Math.abs(value - reference) / Math.abs(reference)) * 100;
}

// Общий бюджет включает уточняющие расчёты. Точки графика хранятся отдельно от шагов.
class Budget {
  remaining = 50_000_000;

  spend(steps: number): void {
    if (steps > this.remaining) {
      throw new Error("Слишком много шагов. Увеличьте исходный шаг.");
    }
    this.remaining -= steps;
  }
}

export function validateInput(step: number, duration: number): void {
  if (duration !== 10 && duration !== 12) {
    throw new Error("Интервал: 10 или 12 с.");
  }
  if (!Number.isFinite(step) || step <= 0 || step >= duration) {
    throw new Error(`Шаг должен быть больше 0 и меньше ${duration} с.`);
  }
}

export function integrate(step: number, duration: number, budget = new Budget()): Solution {
  validateInput(step, duration);
  const steps = Math.ceil(duration / step - 1e-12);
  budget.spend(steps);
  const stride = Math.max(1, Math.ceil(steps / 999));
  let state: State = [...MODEL.initial];
  const points: Point[] = [{ t: 0, x1: state[0], x2: state[1], x3: state[2] }];

  for (let i = 0; i < steps; i++) {
    const t = Math.min((i + 1) * step, duration);
    const previousTime = i * step;
    state = rk4Step(state, t - previousTime);
    // x3' = -u: точное линейное значение исключает накопление ошибки округления массы.
    state[2] = MODEL.initial[2] - MODEL.u * t;
    if (!state.every(Number.isFinite)) {
      throw new Error("Решение неустойчиво. Уменьшите шаг.");
    }
    if ((i + 1) % stride === 0 || i + 1 === steps) {
      points.push({ t, x1: state[0], x2: state[1], x3: state[2] });
    }
  }

  return { step, steps, final: state, points };
}

function compare(solution: Solution, reference: Solution): Comparison {
  return {
    step: solution.step,
    steps: solution.steps,
    error: relativeError(solution.final[0], reference.final[0]),
    reference: reference.final[0],
  };
}

export function calculate(step: number, duration: number, auto = false): Calculation {
  validateInput(step, duration);
  const budget = new Budget();
  const attempts: Comparison[] = [];
  let solution = integrate(step, duration, budget);

  for (let i = 0; i < 30; i++) {
    const reference = integrate(solution.step / 2, duration, budget);
    const comparison = compare(solution, reference);
    attempts.push(comparison);
    if (!auto || comparison.error <= 1) {
      // По методичке принимается решение с шагом h, а h/2 служит эталоном.
      return { solution, comparison, attempts };
    }
    solution = reference;
  }
  throw new Error("Не удалось подобрать шаг. Уменьшите исходный шаг.");
}

export function analyze(step: number, duration: number): Comparison[] {
  validateInput(step, duration);
  const budget = new Budget();
  const rows: Comparison[] = [];
  let solution = integrate(step, duration, budget);
  for (let i = 0; i < 10; i++) {
    const reference = integrate(solution.step / 2, duration, budget);
    rows.push(compare(solution, reference));
    solution = reference;
  }
  return rows.reverse();
}
