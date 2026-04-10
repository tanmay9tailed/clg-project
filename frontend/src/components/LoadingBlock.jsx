export const LoadingBlock = ({ label = "Loading..." }) => (
  <div className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-8 shadow-soft">
    <div className="flex items-center gap-4">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  </div>
);

