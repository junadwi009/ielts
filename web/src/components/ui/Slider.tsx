import React from "react";

export interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  label,
}) => {
  const sliderId = `slider-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const numberId = `${sliderId}-num`;

  const handleRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handleNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!isNaN(v) && v >= min && v <= max) onChange(v);
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={sliderId}
        className="text-sm font-medium text-[var(--color-text)]"
      >
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleRange}
          aria-label={label}
          className="flex-1 min-h-11 accent-[var(--color-primary-600)] cursor-pointer"
        />
        <input
          id={numberId}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleNumber}
          aria-label={`${label} numeric input`}
          className={[
            "w-16 min-h-11 px-2 text-center rounded-[var(--radius-md)] border border-[var(--color-border)]",
            "bg-[var(--color-surface)] text-[var(--color-text)] text-sm",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-600)]",
          ].join(" ")}
        />
      </div>
    </div>
  );
};
