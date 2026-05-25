export default function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-800 shadow-sm">
          <Icon size={18} />
        </div>
        <span className="text-xs font-medium text-slate-500">{hint}</span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
