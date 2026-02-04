export const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex items-center gap-2">
           {action}
        </div>
      )}
    </div>
  );
};
