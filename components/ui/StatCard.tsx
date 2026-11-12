import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  color?: "default" | "green" | "blue" | "red" | "amber";
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  color = "default",
}: StatCardProps) {
  const colors = {
    default: "text-slate-900",
    green: "text-green-600",
    blue: "text-blue-600",
    red: "text-red-600",
    amber: "text-amber-600",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3
            className={`mt-2 text-3xl font-bold ${colors[color]}`}
          >
            {value}
          </h3>

          {description && (
            <p className="mt-2 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}