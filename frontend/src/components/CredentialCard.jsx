import { motion } from "framer-motion";

import { formatAddress, formatDate, formatVisibility } from "../utils/format";
import { CredentialPreview } from "./CredentialPreview";
import { StatusPill } from "./StatusPill";

const renderVerificationBadge = (credential) => {
  if (credential.verified) {
    return <StatusPill tone="success">Verified</StatusPill>;
  }

  if (credential.verificationRequestStatus === "pending") {
    return <StatusPill tone="warning">Pending review</StatusPill>;
  }

  if (credential.verificationRequestStatus === "rejected") {
    return <StatusPill tone="error">Rejected</StatusPill>;
  }

  return <StatusPill tone="warning">Self-added</StatusPill>;
};

export const CredentialCard = ({ credential, index = 0, actions = null }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: index * 0.04 }}
    className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft"
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {renderVerificationBadge(credential)}
          <StatusPill tone={credential.source === "issued" ? "accent" : "neutral"}>
            {credential.source === "issued" ? "Issued" : credential.type}
          </StatusPill>
          <StatusPill tone={credential.visibility === "private" ? "neutral" : "accent"}>
            {formatVisibility(credential.visibility)}
          </StatusPill>
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
            {credential.title}
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Issued by{" "}
            {credential.source === "issued"
              ? credential.issuer
              : credential.issuer}
            {credential.issuerAddress ? ` (${formatAddress(credential.issuerAddress)})` : ""}
          </p>
        </div>
      </div>

      {typeof credential.score === "number" ? (
        <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          Score {credential.score}
        </div>
      ) : null}
    </div>

    <p className="mt-5 text-sm leading-7 text-slate-600">{credential.description}</p>

    <CredentialPreview credential={credential} />

    {credential.source === "issued" ? (
      <div className="mt-5 grid gap-3 rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Issuer type
          </p>
          <p className="mt-1">{credential.issuerType}</p>
        </div>
        {credential.documentHash ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Document hash
            </p>
            <p className="mt-1 break-all">{credential.documentHash.slice(0, 18)}...</p>
          </div>
        ) : null}
      </div>
    ) : null}

    {actions ? <div className="mt-5">{actions}</div> : null}

    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        <span>{credential.type}</span>
        <span>{formatDate(credential.createdAt)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {credential.transactionHash ? (
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Tx {credential.transactionHash.slice(0, 10)}...
          </span>
        ) : null}
        {credential.link ? (
          <a
            href={credential.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-slate-950 transition hover:text-amber-600"
          >
            Open proof
          </a>
        ) : null}
      </div>
    </div>
  </motion.article>
);
