import { useMemo, useState } from "react";

const buildLinkedInShareUrl = (url) =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

const buildWhatsAppShareUrl = (url) =>
  `https://wa.me/?text=${encodeURIComponent(`View this credential profile: ${url}`)}`;

const buildEmailShareUrl = (url) =>
  `mailto:?subject=${encodeURIComponent("Credential profile")}&body=${encodeURIComponent(
    `Take a look at this credential profile:\n\n${url}`
  )}`;

export const ShareProfileButton = ({ url }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareLinks = useMemo(
    () => ({
      linkedin: buildLinkedInShareUrl(url),
      whatsapp: buildWhatsAppShareUrl(url),
      email: buildEmailShareUrl(url)
    }),
    [url]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      return;
    }

    await navigator.share({
      title: "Credential profile",
      text: "View this credential profile",
      url
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
      >
        Share profile
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-3 w-72 rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-soft">
          <div className="space-y-3 text-sm">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left font-semibold text-slate-900 transition hover:border-slate-300"
            >
              {copied ? "Profile link copied" : "Copy link"}
            </button>
            {navigator.share ? (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Share with device apps
              </button>
            ) : null}
            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 transition hover:border-slate-300"
            >
              Share on WhatsApp
            </a>
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 transition hover:border-slate-300"
            >
              Share on LinkedIn
            </a>
            <a
              href={shareLinks.email}
              className="block rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 transition hover:border-slate-300"
            >
              Share by email
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
};
