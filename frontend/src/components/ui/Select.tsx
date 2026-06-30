import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export default function Select({ label, className = '', id, children, ...props }: SelectProps) {
  const selectId = id ?? label?.replace(/\s/g, '-').toLowerCase();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`field-control field-select ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
