interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-5xl font-bold text-slate-900">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 text-lg text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}