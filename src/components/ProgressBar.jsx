export default function ProgressBar({ value, afterValue }) {
  const width = `${Math.max(0, Math.min(100, value))}%`;
  const afterWidth = afterValue === undefined ? null : `${Math.max(0, Math.min(100, afterValue))}%`;

  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width }} />
      </div>
      {afterWidth ? (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: afterWidth }} />
        </div>
      ) : null}
    </div>
  );
}
