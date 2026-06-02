interface Props {
  /** 0-1 */
  value: number;
  className?: string;
  height?: number;
}

export function OmbreProgress({ value, className = "", height = 6 }: Props) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-[color:var(--surface-2)] ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <div
        className="h-full rounded-full bk-ombre transition-[width] duration-500 ease-out"
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}
