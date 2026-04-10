import { startTransition, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { CredentialCard } from "../components/CredentialCard";
import { DashboardSummary } from "../components/DashboardSummary";
import { EmptyState } from "../components/EmptyState";
import { LoadingBlock } from "../components/LoadingBlock";
import { RoleGate } from "../components/RoleGate";
import { SectionHeading } from "../components/SectionHeading";
import { useWallet } from "../hooks/useWallet";
import {
  combineDashboardCredentials,
  deleteAchievement,
  fetchAchievements,
  fetchBlockchainCertificates,
  fetchReceivedCertificates,
  requestAchievementVerification,
  updateAchievementVisibility,
  updateReceivedCredentialVisibility,
} from "../lib/credentials";
import { hasContractConfig } from "../lib/contract";
import { formatAddress, getFriendlyError } from "../utils/format";

const buildTabItems = (credentials) => [
  {
    id: "all",
    label: "All",
    count: credentials.length,
    matches: () => true,
  },
  {
    id: "verified",
    label: "Verified",
    count: credentials.filter((credential) => credential.verified).length,
    matches: (credential) => credential.verified,
  },
  {
    id: "self-added",
    label: "Self-added",
    count: credentials.filter(
      (credential) => credential.source === "achievement" && !credential.verified,
    ).length,
    matches: (credential) => credential.source === "achievement" && !credential.verified,
  },
  {
    id: "pending",
    label: "Pending",
    count: credentials.filter((credential) => credential.verificationRequestStatus === "pending")
      .length,
    matches: (credential) => credential.verificationRequestStatus === "pending",
  },
];

const requestInputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-amber-200";

export const StudentDashboardPage = () => {
  const {
    account,
    authenticated,
    error: walletError,
    userProfile
  } = useWallet();
  const [credentials, setCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRequestId, setExpandedRequestId] = useState("");
  const [requestForms, setRequestForms] = useState({});
  const [actionId, setActionId] = useState("");

  const loadDashboard = async () => {
    if (!account) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [achievementsResult, certificatesResult, receivedResult] = await Promise.allSettled([
        fetchAchievements(account),
        fetchBlockchainCertificates(account),
        fetchReceivedCertificates(account),
      ]);

      const achievements =
        achievementsResult.status === "fulfilled" ? achievementsResult.value : [];
      const blockchainCertificates =
        certificatesResult.status === "fulfilled" ? certificatesResult.value : [];
      const receivedCredentials = receivedResult.status === "fulfilled" ? receivedResult.value : [];

      if (
        achievementsResult.status === "rejected" &&
        certificatesResult.status === "rejected" &&
        receivedResult.status === "rejected"
      ) {
        throw achievementsResult.reason;
      }

      startTransition(() => {
        setCredentials(
          combineDashboardCredentials(achievements, blockchainCertificates, receivedCredentials, {
            includePrivate: true,
          }),
        );
      });
    } catch (loadError) {
      setError(getFriendlyError(loadError, "Unable to load the credential dashboard."));
    } finally {
      setIsLoading(false);
    }
  };

  const copyProfileLink = async () => {
    if (!account) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}/u/${account}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  useEffect(() => {
    loadDashboard();
  }, [account]);

  const handleVisibilityToggle = async (credential) => {
    const nextVisibility = credential.visibility === "public" ? "private" : "public";
    setActionId(credential.id);
    setStatusMessage("");
    setError("");

    try {
      if (credential.source === "achievement") {
        await updateAchievementVisibility(credential.id, nextVisibility);
      } else {
        await updateReceivedCredentialVisibility(credential.id, nextVisibility);
      }

      setStatusMessage(`Credential visibility updated to ${nextVisibility}.`);
      await loadDashboard();
    } catch (updateError) {
      setError(getFriendlyError(updateError, "Unable to update credential visibility."));
    } finally {
      setActionId("");
    }
  };

  const handleDeleteAchievement = async (credential) => {
    const confirmed = window.confirm(
      `Remove "${credential.title}" from your self-added achievements? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setActionId(credential.id);
    setStatusMessage("");
    setError("");

    try {
      await deleteAchievement(credential.id);
      setStatusMessage("Self-added achievement removed.");
      await loadDashboard();
    } catch (deleteError) {
      setError(getFriendlyError(deleteError, "Unable to remove the achievement."));
    } finally {
      setActionId("");
    }
  };

  const openVerificationRequest = (credential) => {
    setExpandedRequestId((current) => (current === credential.id ? "" : credential.id));
    setRequestForms((current) => ({
      ...current,
      [credential.id]: current[credential.id] || {
        issuerName: credential.issuer || "",
        issuerAddress: credential.verificationRequest?.issuerAddress || "",
        note: credential.verificationRequest?.note || "",
      },
    }));
  };

  const handleRequestFormChange = (credentialId, field, value) => {
    setRequestForms((current) => ({
      ...current,
      [credentialId]: {
        ...current[credentialId],
        [field]: value,
      },
    }));
  };

  const submitVerificationRequest = async (credentialId) => {
    const payload = requestForms[credentialId];

    if (!payload?.issuerName || !payload?.issuerAddress) {
      setError("Provide both the issuer name and issuer wallet address.");
      return;
    }

    setActionId(credentialId);
    setStatusMessage("");
    setError("");

    try {
      await requestAchievementVerification(credentialId, payload);
      setStatusMessage("Verification request sent to the issuer.");
      setExpandedRequestId("");
      await loadDashboard();
    } catch (requestError) {
      setError(getFriendlyError(requestError, "Unable to send verification request."));
    } finally {
      setActionId("");
    }
  };

  if (!authenticated || !account || userProfile?.role !== "receiver") {
    return <RoleGate role="receiver" />;
  }

  const tabItems = buildTabItems(credentials);
  const activeMatcher = tabItems.find((tab) => tab.id === activeTab)?.matches || (() => true);
  const filteredCredentials = credentials.filter(activeMatcher);

  const renderCredentialActions = (credential) => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => handleVisibilityToggle(credential)}
          disabled={actionId === credential.id}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {actionId === credential.id
            ? "Updating..."
            : credential.visibility === "public"
            ? "Make private"
            : "Make public"}
        </button>

        {credential.source === "achievement" && !credential.verified ? (
          <button
            type="button"
            onClick={() => openVerificationRequest(credential)}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {credential.verificationRequestStatus === "pending"
              ? "Review request details"
              : "Send to issuer for verification"}
          </button>
        ) : null}

        {credential.source === "achievement" ? (
          <button
            type="button"
            onClick={() => handleDeleteAchievement(credential)}
            disabled={actionId === credential.id}
            className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {actionId === credential.id ? "Removing..." : "Remove"}
          </button>
        ) : null}
      </div>

      {credential.source === "achievement" && credential.verificationRequestStatus === "pending" ? (
        <p className="rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          Waiting on {credential.verificationRequest?.issuerName} to review this self-added
          credential.
        </p>
      ) : null}

      {credential.source === "achievement" && expandedRequestId === credential.id ? (
        <div className="grid gap-4 rounded-[1.5rem] bg-slate-50 p-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Issuer name
            <input
              type="text"
              value={requestForms[credential.id]?.issuerName || ""}
              onChange={(event) =>
                handleRequestFormChange(credential.id, "issuerName", event.target.value)
              }
              className={`mt-2 ${requestInputClass}`}
              placeholder="IIT Bombay"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Issuer wallet address
            <input
              type="text"
              value={requestForms[credential.id]?.issuerAddress || ""}
              onChange={(event) =>
                handleRequestFormChange(credential.id, "issuerAddress", event.target.value)
              }
              className={`mt-2 ${requestInputClass}`}
              placeholder="0x..."
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Verification note
            <textarea
              rows="3"
              value={requestForms[credential.id]?.note || ""}
              onChange={(event) =>
                handleRequestFormChange(credential.id, "note", event.target.value)
              }
              className={`mt-2 ${requestInputClass}`}
              placeholder="Add any context the issuer should check."
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => submitVerificationRequest(credential.id)}
              disabled={actionId === credential.id}
              className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {actionId === credential.id ? "Sending request..." : "Send verification request"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <section className="rounded-[2.5rem] border border-white/70 bg-white/80 p-8 shadow-soft">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Receiver Dashboard"
            title="See issued credentials, self-added proofs, and privacy controls in one place."
            description="Issued credentials land here for the receiver wallet, self-added credentials can be sent to issuers for review, and every item can be made public or private."
          />

          <div className="space-y-3 rounded-[2rem] bg-slate-950 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Connected wallet
            </p>
            <p className="font-display text-2xl font-semibold">{formatAddress(account)}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyProfileLink}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
              >
                {copied ? "Profile link copied" : "Copy public profile"}
              </button>
              <Link
                to="/achievements/new"
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Add achievement
              </Link>
            </div>
          </div>
        </div>

        {!hasContractConfig ? (
          <p className="mt-6 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
            Contract address is not configured yet. Issued credentials will appear after setting{" "}
            <code>VITE_CERTIFICATE_CONTRACT_ADDRESS</code>.
          </p>
        ) : null}
        {walletError ? (
          <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">
            {walletError}
          </p>
        ) : null}
        {statusMessage ? (
          <p className="mt-4 rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">
            {statusMessage}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">{error}</p>
        ) : null}
      </section>

      {isLoading ? <LoadingBlock label="Refreshing receiver credentials..." /> : null}

      {!isLoading ? <DashboardSummary credentials={credentials} /> : null}

      {!isLoading && credentials.length ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Credential Views"
              title="Switch between verified and self-added proof."
              description="Issued credentials are verified by design. Self-added items can stay private, become public, or be routed to an issuer for review."
            />
            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
            >
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-slate-950 text-white"
                    : "border border-slate-300 bg-white text-slate-900 hover:border-slate-400"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="grid gap-5">
            {filteredCredentials.map((credential, index) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                index={index}
                actions={renderCredentialActions(credential)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!isLoading && credentials.length && !filteredCredentials.length ? (
        <EmptyState
          title="No credentials in this tab."
          description="Switch tabs to review issued credentials, verified items, or self-added credentials waiting for issuer review."
        />
      ) : null}

      {!isLoading && !credentials.length ? (
        <EmptyState
          title="No credentials yet."
          description="Add your first self-added achievement, or wait for an issuer to upload a verified document to your receiver wallet."
          action={
            <Link
              to="/achievements/new"
              className="inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Add your first achievement
            </Link>
          }
        />
      ) : null}
    </>
  );
};
