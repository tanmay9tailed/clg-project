export const SectionHeading = ({ eyebrow, title, description, align = "left" }) => (
  <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
    {eyebrow ? (
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
      {title}
    </h2>
    {description ? (
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    ) : null}
  </div>
);

