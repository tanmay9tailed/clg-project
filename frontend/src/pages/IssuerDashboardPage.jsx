import { useEffect, useState } from "react";
import { ethers } from "ethers";

import { EmptyState } from "../components/EmptyState";
import { LoadingBlock } from "../components/LoadingBlock";
import { RoleGate } from "../components/RoleGate";
import { SectionHeading } from "../components/SectionHeading";
import { useWallet } from "../hooks/useWallet";
import { api } from "../lib/api";
import {
  fetchIssuedCertificatesByIssuer,
  fetchIssuerVerificationRequests,
  reviewAchievementVerification
} from "../lib/credentials";
import {
  ensureRequiredWalletNetwork,
  getCertificateWriteContract,
  hasContractConfig
} from "../lib/contract";
import { formatAddress, formatDate, getFriendlyError } from "../utils/format";
import {
  buildIssuerSignatureMessage,
  hashFileSha256
} from "../utils/issuerProof";

const initialFormState = {
  studentAddress: "",
  certId: ""
};

const initialProfileForm = {
  organizationName: "",
  issuerType: "Certificate Provider"
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-amber-200";

const tabs = [
  { id: "issue", label: "Issue credential" },
  { id: "review", label: "Review requests" },
  { id: "history", label: "Issued history" },
  { id: "profile", label: "Profile" }
];

export const IssuerDashboardPage = () => {
  const {
    account,
    authenticated,
    signer,
    updateWalletProfile,
    userProfile
  } = useWallet();
  const [isChecking, setIsChecking] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [certificateFile, setCertificateFile] = useState(null);
  const [records, setRecords] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("issue");
  const [reviewingId, setReviewingId] = useState("");

  const loadIssuedCertificates = async (issuerAddress) => {
    const nextRecords = await fetchIssuedCertificatesByIssuer(issuerAddress);
    setRecords(nextRecords);
  };

  const loadVerificationRequests = async () => {
    const nextRequests = await fetchIssuerVerificationRequests();
    setVerificationRequests(nextRequests);
  };

  useEffect(() => {
    if (!userProfile) {
      return;
    }

    setProfileForm({
      organizationName: userProfile.organizationName || "",
      issuerType: userProfile.issuerType || "Certificate Provider"
    });
  }, [userProfile]);

  useEffect(() => {
    if (!account || !authenticated || userProfile?.role !== "issuer") {
      return;
    }

    const loadIssuerWorkspace = async () => {
      setIsChecking(true);
      setError("");
      setStatusMessage("");
      setRecords([]);
      setVerificationRequests([]);

      try {
        await Promise.all([loadIssuedCertificates(account), loadVerificationRequests()]);
      } catch (issuerError) {
        setError(
          getFriendlyError(
            issuerError,
            "Unable to load issuer workspace."
          )
        );
      } finally {
        setIsChecking(false);
      }
    };

    loadIssuerWorkspace();
  }, [account, authenticated, userProfile?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setIsSavingProfile(true);
    setStatusMessage("");
    setError("");

    try {
      await updateWalletProfile({
        role: "issuer",
        organizationName: profileForm.organizationName,
        issuerType: profileForm.issuerType
      });
      setStatusMessage("Issuer profile updated.");
    } catch (profileError) {
      setError(getFriendlyError(profileError, "Unable to update issuer profile."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!account || !authenticated) {
      setError("Connect and verify your wallet before issuing certificates.");
      return;
    }

    if (!certificateFile) {
      setError("Upload the certificate PDF before submitting.");
      return;
    }

    if (!ethers.isAddress(form.studentAddress)) {
      setError("Enter a valid student wallet address.");
      return;
    }

    if (!userProfile?.organizationName) {
      setError("Complete your issuer organization profile before uploading credentials.");
      return;
    }

    if (!signer) {
      setError("Wallet signer is unavailable. Reconnect MetaMask and try again.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setStatusMessage("");

    try {
      await ensureRequiredWalletNetwork();

      const documentHash = await hashFileSha256(certificateFile);
      const signatureMessage = buildIssuerSignatureMessage({
        issuerName: userProfile.organizationName,
        issuerType: userProfile.issuerType || "Certificate Provider",
        certId: form.certId,
        studentAddress: form.studentAddress,
        documentHash
      });
      const issuerSignature = await signer.signMessage(signatureMessage);

      const uploadPayload = new FormData();
      uploadPayload.append("certificate", certificateFile);

      const uploadResponse = await api.post("/ipfs/upload-certificate", uploadPayload);

      const { cid, gatewayUrl } = uploadResponse.data.data;
      const contract = await getCertificateWriteContract();
      const transaction = await contract.issueCertificate(
        form.studentAddress,
        form.certId,
        cid
      );
      const receipt = await transaction.wait();

      await api.post("/issuer/record", {
        issuerAddress: account,
        issuerName: userProfile.organizationName,
        issuerType: userProfile.issuerType || "Certificate Provider",
        studentAddress: form.studentAddress.toLowerCase(),
        certId: form.certId,
        cid,
        gatewayUrl,
        visibility: "private",
        documentHash,
        signatureMessage,
        issuerSignature,
        transactionHash: receipt.hash
      });

      await loadIssuedCertificates(account);
      setStatusMessage(
        `Credential issued successfully. The signed document is stored on IPFS and starts as private for the receiver. Transaction hash: ${receipt.hash}`
      );
      setForm(initialFormState);
      setCertificateFile(null);
      event.target.reset();
    } catch (submitError) {
      setError(
        getFriendlyError(
          submitError,
          "Unable to issue the certificate. Check wallet access and backend configuration."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (achievementId, decision, issuerName) => {
    setReviewingId(achievementId);
    setError("");
    setStatusMessage("");

    try {
      await reviewAchievementVerification(achievementId, {
        decision,
        issuerName
      });
      await loadVerificationRequests();
      setStatusMessage(
        decision === "approve"
          ? "Self-added credential approved and marked as verified."
          : "Verification request rejected."
      );
    } catch (reviewError) {
      setError(
        getFriendlyError(reviewError, "Unable to review the verification request.")
      );
    } finally {
      setReviewingId("");
    }
  };

  if (!authenticated || !account || userProfile?.role !== "issuer") {
    return <RoleGate role="issuer" />;
  }

  if (!hasContractConfig) {
    return (
      <EmptyState
        title="Contract configuration is missing."
        description="Set VITE_CERTIFICATE_CONTRACT_ADDRESS in the frontend environment before using the issuer dashboard."
      />
    );
  }

  return (
    <>
      <section className="rounded-[2.5rem] border border-white/70 bg-white/85 p-8 shadow-soft">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Issuer Dashboard"
            title="Issue verifiable certificates from your issuer profile."
            description="Issuers upload the certificate PDF to Pinata, receive a CID, and then call the smart contract to write the proof to blockchain."
          />

          <div className="rounded-[2rem] bg-slate-950 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Issuer wallet
            </p>
            <p className="mt-3 font-display text-2xl font-semibold">{formatAddress(account)}</p>
            <p className="mt-2 text-sm text-slate-300">
              {userProfile.organizationName} - {userProfile.issuerType}
            </p>
          </div>
        </div>

        {isChecking ? (
          <div className="mt-6">
            <LoadingBlock label="Loading issuer workspace..." />
          </div>
        ) : null}

        {!isChecking && error ? (
          <p className="mt-6 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
        {!isChecking && statusMessage ? (
          <p className="mt-6 rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">
            {statusMessage}
          </p>
        ) : null}
      </section>

      {!isChecking ? (
        <section className="space-y-8">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
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
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "issue" ? (
            <div className="rounded-[2.5rem] border border-white/70 bg-white/80 p-8 shadow-soft">
              <SectionHeading
                eyebrow="Issue Credential"
                title="Sign first, upload second, issue on-chain third."
                description={`Documents are issued as ${userProfile.organizationName}. Update your organization details from the Profile tab if needed.`}
              />

              <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                  Issuer profile: <strong>{userProfile.organizationName}</strong> (
                  {userProfile.issuerType || "Certificate Provider"}). The document will be
                  hashed and signed with this wallet before upload.
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Receiver wallet address
                  <input
                    type="text"
                    name="studentAddress"
                    value={form.studentAddress}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="0x..."
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Certificate ID
                  <input
                    type="text"
                    name="certId"
                    value={form.certId}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="CERT-2026-001"
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Certificate PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setCertificateFile(event.target.files?.[0] || null)}
                    className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white`}
                    required
                  />
                </label>

                <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                  The document will be hashed and signed with the issuer wallet before upload.
                  Issued credentials are created as private by default so the receiver controls
                  when they appear publicly.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Signing, uploading, and issuing..." : "Sign document and issue credential"}
                </button>
              </form>
            </div>
          ) : null}

          {activeTab === "review" ? (
            <div className="rounded-[2.5rem] border border-white/70 bg-white/80 p-8 shadow-soft">
              <SectionHeading
                eyebrow="Verification Requests"
                title="Review self-added credentials sent by receivers."
                description="Receivers can submit self-added credentials to your issuer wallet for review. Approving marks them as verified in the receiver dashboard and public profile when visible."
              />

              <div className="mt-8 space-y-4">
                {verificationRequests.length ? (
                  verificationRequests.map((request) => (
                    <article
                      key={request._id}
                      className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="font-display text-xl font-semibold text-slate-950">
                            {request.title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            Receiver: {formatAddress(request.userAddress)}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Requested on {formatDate(request.verificationRequest?.requestedAt || request.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {request.verificationRequest?.status || "pending"}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {request.description}
                      </p>

                      {request.verificationRequest?.note ? (
                        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                          Note: {request.verificationRequest.note}
                        </p>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={
                            reviewingId === request._id ||
                            request.verificationRequest?.status !== "pending"
                          }
                          onClick={() =>
                            handleReview(
                              request._id,
                              "approve",
                              request.verificationRequest?.issuerName || request.issuer
                            )
                          }
                          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {reviewingId === request._id ? "Reviewing..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            reviewingId === request._id ||
                            request.verificationRequest?.status !== "pending"
                          }
                          onClick={() =>
                            handleReview(
                              request._id,
                              "reject",
                              request.verificationRequest?.issuerName || request.issuer
                            )
                          }
                          className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Reject
                        </button>
                        {request.link ? (
                          <a
                            href={request.link}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
                          >
                            Open supporting proof
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="No verification requests yet."
                    description="Self-added credentials routed to this issuer wallet will appear here for review."
                  />
                )}
              </div>
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div className="rounded-[2.5rem] border border-white/70 bg-white/80 p-8 shadow-soft">
              <SectionHeading
                eyebrow="Issued History"
                title="Recent issuer activity"
                description="Each successful issuance records the receiver wallet, the signed document proof, and the IPFS gateway link."
              />

              <div className="mt-8 space-y-4">
                {records.length ? (
                  records.map((record) => (
                    <article
                      key={record._id}
                      className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-display text-xl font-semibold text-slate-950">
                            {record.certId}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.issuerName} - {record.issuerType}
                          </p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {formatDate(record.issuedAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        Receiver: {formatAddress(record.studentAddress)}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Visibility default: {record.visibility}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-4">
                        <a
                          href={record.gatewayUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-950 transition hover:text-amber-600"
                        >
                          Open PDF
                        </a>
                        <span className="text-sm text-slate-500">
                          Hash: {record.documentHash.slice(0, 12)}...
                        </span>
                        {record.transactionHash ? (
                          <span className="text-sm text-slate-500">
                            Tx: {record.transactionHash.slice(0, 10)}...
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="No credentials issued yet."
                    description="Successful issuer uploads will appear here once the document is signed, pushed to IPFS, and recorded."
                  />
                )}
              </div>
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="rounded-[2.5rem] border border-white/70 bg-white/80 p-8 shadow-soft">
              <SectionHeading
                eyebrow="Issuer Profile"
                title="Update the organization tied to this issuer wallet."
                description="These details are reused whenever you upload a certificate, so you do not need to re-enter the organization name on every issue."
              />

              <form className="mt-8 space-y-6" onSubmit={handleProfileSubmit}>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Organization name
                    <input
                      type="text"
                      name="organizationName"
                      value={profileForm.organizationName}
                      onChange={handleProfileChange}
                      className={inputClass}
                      placeholder="IIT Bombay"
                      required
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Issuer type
                    <select
                      name="issuerType"
                      value={profileForm.issuerType}
                      onChange={handleProfileChange}
                      className={inputClass}
                    >
                      <option value="College">College</option>
                      <option value="Certificate Provider">Certificate Provider</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingProfile ? "Saving profile..." : "Save issuer profile"}
                </button>
              </form>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
};
