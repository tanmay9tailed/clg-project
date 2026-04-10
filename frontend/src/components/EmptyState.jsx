export const EmptyState = ({ title, description, action }) => (
  <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
    <h3 className="font-display text-2xl font-semibold text-slate-950">{title}</h3>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);

