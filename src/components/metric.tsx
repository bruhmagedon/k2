import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
  isError = false,
}: {
  label: string;
  value: string;
  isError?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="mb-2 text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "break-words font-mono text-xl tabular-nums tracking-tight sm:text-2xl",
          isError ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export { Metric };
