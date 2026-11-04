export function ModelDetails() {
  return (
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
  );
}
