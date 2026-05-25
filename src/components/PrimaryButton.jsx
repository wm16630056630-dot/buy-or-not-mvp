export default function PrimaryButton({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800',
    secondary: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    warning: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
  };

  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
