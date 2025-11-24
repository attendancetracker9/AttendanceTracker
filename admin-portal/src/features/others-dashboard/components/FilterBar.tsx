import React from "react";
import { SlidersHorizontal } from "lucide-react";

type Option = { label: string; value: string };

type FilterBarProps = {
  title?: string;
  filters: Array<{
    id: string;
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
  }>;
};

export const FilterBar: React.FC<FilterBarProps> = ({ title = "Filters", filters }) => {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-white">
        <SlidersHorizontal className="h-4 w-4 text-teal-500" />
        <span>{title}</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <label key={filter.id} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">
            {filter.label}
            <select
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
};


