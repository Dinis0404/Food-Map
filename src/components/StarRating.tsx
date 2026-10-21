"use client";

const STARS = [1, 2, 3, 4, 5];

export function StarInput({
  value,
  onChange,
  size = "text-xl",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: string;
}) {
  return (
    <div className={`flex ${size} leading-none`} role="radiogroup">
      {STARS.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} 星`}
          onClick={() => onChange(n)}
          className={`transition-colors ${
            n <= value
              ? "text-amber-400"
              : "text-stone-300 hover:text-amber-200"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function StarDisplay({
  value,
  size = "text-base",
}: {
  value: number | null;
  size?: string;
}) {
  if (value == null) {
    return <span className={`text-stone-400 ${size}`}>未有評分</span>;
  }
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-1 ${size}`} title={`${value} / 5`}>
      <span className="text-amber-400">
        {STARS.map((n) => (
          <span key={n} className={n <= full ? "" : "text-stone-300"}>
            ★
          </span>
        ))}
      </span>
      <span className="text-stone-500 text-sm">{value}</span>
    </span>
  );
}
