const imagePattern = /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;
const pdfPattern = /\.pdf(\?.*)?$/i;

const getHost = (value = "") => {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const getPreviewKind = (credential) => {
  const link = credential.link || "";
  const host = getHost(link);

  if (credential.previewImage || imagePattern.test(link)) {
    return "image";
  }

  if (credential.source === "issued" || pdfPattern.test(link)) {
    return "pdf";
  }

  if (host.includes("linkedin.com")) {
    return "linkedin";
  }

  if (host.includes("github.com") || host.includes("githubusercontent.com")) {
    return "github";
  }

  if (link) {
    return "link";
  }

  return "none";
};

const getLinkLabel = (credential) => {
  const host = getHost(credential.link);

  if (host) {
    return host;
  }

  if (credential.cid) {
    return credential.cid;
  }

  return "Proof link";
};

export const CredentialPreview = ({ credential }) => {
  const kind = getPreviewKind(credential);

  if (kind === "none") {
    return null;
  }

  const previewUrl = credential.previewImage || credential.link;
  const linkLabel = getLinkLabel(credential);

  if (kind === "image") {
    return (
      <a
        href={credential.link || previewUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 block overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100"
      >
        <img
          src={previewUrl}
          alt={`${credential.title} preview`}
          loading="lazy"
          className="h-56 w-full object-cover transition duration-300 hover:scale-[1.02]"
        />
      </a>
    );
  }

  if (kind === "pdf") {
    return (
      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
        <iframe
          title={`${credential.title} certificate preview`}
          src={`${credential.link}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
          className="h-64 w-full bg-white"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Certificate preview
          </span>
          <a
            href={credential.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-slate-950 transition hover:text-amber-600"
          >
            Open PDF
          </a>
        </div>
      </div>
    );
  }

  const platformLabel =
    kind === "linkedin"
      ? "LinkedIn proof"
      : kind === "github"
        ? "GitHub proof"
        : "External proof";

  return (
    <a
      href={credential.link}
      target="_blank"
      rel="noreferrer"
      className="mt-5 block overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 text-white transition hover:-translate-y-0.5 hover:border-amber-300"
    >
      <div className="relative min-h-36 p-5">
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-amber-300/20 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          {platformLabel}
        </p>
        <p className="mt-4 font-display text-2xl font-semibold">
          {credential.title}
        </p>
        <p className="mt-3 text-sm text-slate-300">
          Preview from {linkLabel}. Open the proof to view the original post,
          repository, badge, or evidence page.
        </p>
      </div>
    </a>
  );
};
