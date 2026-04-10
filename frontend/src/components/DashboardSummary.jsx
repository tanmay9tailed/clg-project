export const DashboardSummary = ({ credentials = [] }) => {
  const verifiedCount = credentials.filter((item) => item.verified).length;
  const issuedCount = credentials.filter((item) => item.source === "issued").length;
  const privateCount = credentials.filter((item) => item.visibility === "private").length;

  const stats = [
    { label: "Total credentials", value: credentials.length },
    { label: "Verified proofs", value: verifiedCount },
    { label: "Issued credentials", value: issuedCount },
    { label: "Private items", value: privateCount }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {stat.label}
          </p>
          <p className="mt-3 font-display text-3xl font-bold text-slate-950">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};
