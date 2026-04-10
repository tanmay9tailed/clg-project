import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import { SectionHeading } from "../components/SectionHeading";
import { useWallet } from "../hooks/useWallet";

const platformFeatures = [
  "Role-first entry for issuers and receivers",
  "Issuer-signed documents before IPFS upload",
  "Public and private credential visibility with ranking by trust and impact"
];

const workflow = [
  {
    title: "Receivers own the profile",
    description:
      "Connect once, receive issued credentials, add your own achievements, and control which items stay private or become public."
  },
  {
    title: "Issuers verify before upload",
    description:
      "Colleges and certificate providers sign the document hash with MetaMask, upload to IPFS, and issue the credential to the receiver wallet."
  },
  {
    title: "Public profiles stay ranked",
    description:
      "ProofRank combines MongoDB achievements and blockchain certificates, then orders them using a transparent score model."
  }
];

const initialIssuerProfile = {
  organizationName: "",
  issuerType: "Certificate Provider"
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/30";

export const HomePage = () => {
  const {
    account,
    authenticated,
    connectWallet,
    updateWalletProfile,
    userProfile
  } = useWallet();
  const navigate = useNavigate();
  const [issuerProfile, setIssuerProfile] = useState(initialIssuerProfile);
  const [selectedRole, setSelectedRole] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleError, setRoleError] = useState("");

  const ensureWallet = async () => {
    if (authenticated && account) {
      return true;
    }

    const connectedAddress = await connectWallet();
    return Boolean(connectedAddress);
  };

  const handleReceiverStart = async () => {
    setIsSavingRole(true);
    setRoleError("");

    try {
      const hasWallet = await ensureWallet();

      if (!hasWallet) {
        return;
      }

      await updateWalletProfile({ role: "receiver" });
      navigate("/dashboard");
    } catch (error) {
      setRoleError(error?.response?.data?.message || error.message || "Unable to save receiver role.");
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleIssuerStart = async () => {
    setSelectedRole("issuer");
    setRoleError("");

    await ensureWallet();
  };

  const handleIssuerProfileChange = (event) => {
    const { name, value } = event.target;
    setIssuerProfile((current) => ({ ...current, [name]: value }));
  };

  const handleIssuerProfileSubmit = async (event) => {
    event.preventDefault();

    setIsSavingRole(true);
    setRoleError("");

    try {
      const hasWallet = await ensureWallet();

      if (!hasWallet) {
        return;
      }

      await updateWalletProfile({
        role: "issuer",
        organizationName: issuerProfile.organizationName,
        issuerType: issuerProfile.issuerType
      });
      navigate("/issuer");
    } catch (error) {
      setRoleError(error?.response?.data?.message || error.message || "Unable to save issuer profile.");
    } finally {
      setIsSavingRole(false);
    }
  };

  const roleDashboardPath = userProfile?.role === "issuer" ? "/issuer" : "/dashboard";

  return (
    <>
      <section className="relative overflow-hidden rounded-[2.75rem] bg-slate-950 px-6 py-10 text-white shadow-soft sm:px-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.32),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(45,212,191,0.24),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent)]" />
        <div className="relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-300">
              Choose Your Role
            </p>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight sm:text-6xl">
              Start as an issuer or step in as a receiver.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              ProofRank Wallet now begins with a role choice. Issuers can be colleges or
              certificate providers. Receivers can manage issued credentials, self-added
              achievements, public sharing, and issuer verification requests from the same wallet.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 transition hover:bg-white/15">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Receiver
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold text-white">
                  View credentials tied to your address
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Track issued credentials, add your own achievements, send them to an issuer
                  for review, and control public visibility.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {userProfile?.role ? (
                    <Link
                      to={roleDashboardPath}
                      className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950"
                    >
                      Continue as {userProfile.role}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReceiverStart}
                      disabled={isSavingRole}
                      className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingRole ? "Saving..." : "Start as receiver"}
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 transition hover:bg-white/15">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Issuer
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold text-white">
                  Sign, upload, and issue verified documents
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Colleges and certificate providers sign a document hash before upload, write
                  the IPFS CID on-chain, and review self-added verification requests.
                </p>
                <div className="mt-6">
                  {userProfile?.role ? (
                    <Link
                      to={roleDashboardPath}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open your dashboard
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleIssuerStart}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Start as issuer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {selectedRole === "issuer" && !userProfile?.role ? (
              <form
                className="mt-6 rounded-[2rem] border border-white/15 bg-white/10 p-6"
                onSubmit={handleIssuerProfileSubmit}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Issuer profile
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Organization name
                    <input
                      type="text"
                      name="organizationName"
                      value={issuerProfile.organizationName}
                      onChange={handleIssuerProfileChange}
                      className={inputClass}
                      placeholder="IIT Bombay"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-200">
                    Issuer type
                    <select
                      name="issuerType"
                      value={issuerProfile.issuerType}
                      onChange={handleIssuerProfileChange}
                      className={inputClass}
                    >
                      <option className="text-slate-950" value="College">
                        College
                      </option>
                      <option className="text-slate-950" value="Certificate Provider">
                        Certificate Provider
                      </option>
                      <option className="text-slate-950" value="Other">
                        Other
                      </option>
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isSavingRole}
                  className="mt-5 rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingRole ? "Saving issuer profile..." : "Save issuer profile"}
                </button>
              </form>
            ) : null}

            {roleError ? (
              <p className="mt-5 rounded-2xl bg-rose-400/15 px-4 py-3 text-sm text-rose-100">
                {roleError}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {userProfile?.role ? (
                <Link
                  to={roleDashboardPath}
                  className="inline-flex items-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  Open dashboard
                </Link>
              ) : (
                <span className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white">
                  Choose a role to bind this wallet
                </span>
              )}
              <Link
                to={account ? `/u/${account}` : "/"}
                className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
              >
                {account ? "View public profile" : "Connect wallet first"}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-[2.25rem] border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
              System signals
            </p>
            <div className="mt-8 space-y-5">
              {platformFeatures.map((feature) => (
                <div key={feature} className="border-b border-white/10 pb-5 last:border-none last:pb-0">
                  <p className="text-lg leading-7 text-white">{feature}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <SectionHeading
          eyebrow="Workflow"
          title="One profile, two trust layers, zero dependence on private keys."
          description="Receivers authenticate with signed wallet messages, issuers use a wallet-bound organization profile, and the public profile combines public self-added context with verifiable issued proof."
        />

        <div className="space-y-6">
          {workflow.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-soft"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Step {index + 1}
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-white/70 bg-white/70 p-8 shadow-soft">
        <SectionHeading
          eyebrow="Ready To Build"
          title="Receiver dashboard, issuer portal, public portfolio."
          description="The app now supports self-added achievements, signed issuer uploads, review requests, privacy controls, and shareable public profiles without sacrificing clarity in the UI."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Link
            to="/dashboard"
            className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Receiver
            </p>
            <h3 className="mt-4 font-display text-2xl font-semibold text-slate-950">
              Manage ranked achievements
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Review blockchain certificates, self-added milestones, and public profile visibility.
            </p>
          </Link>

          <Link
            to="/achievements/new"
            className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Add
            </p>
            <h3 className="mt-4 font-display text-2xl font-semibold text-slate-950">
              Publish a new achievement
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Add title, issuer, description, evidence link, and category to enrich the credential timeline.
            </p>
          </Link>

          <Link
            to="/issuer"
            className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Issuer
            </p>
            <h3 className="mt-4 font-display text-2xl font-semibold text-slate-950">
              Issue tamper-evident certificates
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Upload the PDF to IPFS, sign a transaction in MetaMask, and create a permanent proof trail.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
};
