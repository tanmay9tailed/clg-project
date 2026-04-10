export const StatusPill = ({ tone = "neutral", children }) => {
  const classes = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    neutral: "bg-slate-100 text-slate-700",
    error: "bg-rose-100 text-rose-800",
    accent: "bg-cyan-100 text-cyan-800"
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
        classes[tone] || classes.neutral
      }`}
    >
      {children}
    </span>
  );
};

