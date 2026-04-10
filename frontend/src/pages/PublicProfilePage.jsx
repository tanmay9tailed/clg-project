import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";

import { CredentialCard } from "../components/CredentialCard";
import { EmptyState } from "../components/EmptyState";
import { LoadingBlock } from "../components/LoadingBlock";
import { SectionHeading } from "../components/SectionHeading";
import { ShareProfileButton } from "../components/ShareProfileButton";
import {
  combineAndRankCredentials,
  fetchAchievements,
  fetchBlockchainCertificates,
  fetchReceivedCertificates
} from "../lib/credentials";
import { formatAddress, getFriendlyError } from "../utils/format";

export const PublicProfilePage = () => {
  const { address = "" } = useParams();
  const [credentials, setCredentials] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const isValidAddress = ethers.isAddress(address);

  useEffect(() => {
    if (!isValidAddress) {
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [achievementsResult, certificatesResult, receivedResult] =
          await Promise.allSettled([
            fetchAchievements(address, { publicOnly: true }),
            fetchBlockchainCertificates(address),
            fetchReceivedCertificates(address, { publicOnly: true })
          ]);

        const achievements =
          achievementsResult.status === "fulfilled" ? achievementsResult.value : [];
        const certificates =
          certificatesResult.status === "fulfilled" ? certificatesResult.value : [];
        const receivedCredentials =
          receivedResult.status === "fulfilled" ? receivedResult.value : [];
          
        if (
          achievementsResult.status === "rejected" &&
          certificatesResult.status === "rejected" &&
          receivedResult.status === "rejected"
        ) {
          throw achievementsResult.reason;
        }
        startTransition(() => {
          setCredentials(
            combineAndRankCredentials(
              achievements,
              certificates,
              receivedCredentials,
              { includePrivate: false }
            )
          );
        });
      } catch (loadError) {
        setError(
          getFriendlyError(loadError, "Unable to load the public profile right now.")
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [address, isValidAddress]);

  if (!isValidAddress) {
    return (
      <EmptyState
        title="This wallet address is invalid."
        description="Use a valid Ethereum wallet address in the URL to view a public credential profile."
      />
    );
  }

  const filteredCredentials = credentials.filter((credential) => {
    if (!deferredQuery) {
      return true;
    }

    return [credential.title, credential.issuer, credential.description, credential.type]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(deferredQuery));
  });
  const profileUrl = `${window.location.origin}/u/${address.toLowerCase()}`;

  return (
    <>
      <section className="rounded-[2.5rem] border border-white/70 bg-white/85 p-8 shadow-soft">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Public Profile"
            title="A portfolio of credentials, ordered by trust and relevance."
            description="This page shows public self-added achievements and shareable issued credentials, ranked using the portfolio scoring model."
          />
          <div className="rounded-[2rem] bg-slate-950 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Wallet
            </p>
            <p className="mt-3 font-display text-2xl font-semibold">{formatAddress(address)}</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-300">{credentials.length} credentials visible</p>
              <ShareProfileButton url={profileUrl} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_220px_220px]">
          <label className="block text-sm font-medium text-slate-700">
            Search credentials
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-amber-200"
              placeholder="Search by title, issuer, or type"
            />
          </label>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Total credentials
            </p>
            <p className="mt-3 font-display text-3xl font-bold text-slate-950">
              {credentials.length}
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Highest score
            </p>
            <p className="mt-3 font-display text-3xl font-bold text-slate-950">
              {credentials[0]?.score || 0}
            </p>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
      </section>

      {isLoading ? <LoadingBlock label="Assembling public credentials..." /> : null}

      {!isLoading && filteredCredentials.length ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Portfolio Stack"
            title="Sorted credentials"
            description="Only public credentials appear here, with higher-ranked proofs combining credibility, impact, verification, freshness, and domain fit."
          />
          <div className="grid gap-5">
            {filteredCredentials.map((credential, index) => (
              <CredentialCard key={credential.id} credential={credential} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      {!isLoading && !filteredCredentials.length ? (
        <EmptyState
          title="No credentials match this view."
          description={
            credentials.length
              ? "Try a broader search term to see more certificates and achievements."
              : "This address has not published any achievements or certificates yet."
          }
        />
      ) : null}
    </>
  );
};
