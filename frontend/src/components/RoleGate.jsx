import { Link } from "react-router-dom";

import { useWallet } from "../hooks/useWallet";
import { EmptyState } from "./EmptyState";

const roleDashboardPath = {
  issuer: "/issuer",
  receiver: "/dashboard"
};

export const RoleGate = ({ role, children }) => {
  const { account, authenticated, connectWallet, userProfile } = useWallet();

  if (!authenticated || !account) {
    return (
      <EmptyState
        title="Connect and verify your wallet to continue."
        description="The dashboard is tied to your wallet role, so MetaMask verification is required before opening this workspace."
        action={
          <button
            type="button"
            onClick={connectWallet}
            className="inline-flex items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Connect and verify wallet
          </button>
        }
      />
    );
  }

  if (!userProfile?.role) {
    return (
      <EmptyState
        title="Choose a wallet role first."
        description="This wallet has not been bound to issuer or receiver mode yet. Pick a role on the start page to continue."
        action={
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Choose role
          </Link>
        }
      />
    );
  }

  if (userProfile.role !== role) {
    return (
      <EmptyState
        title={`This wallet is registered as a ${userProfile.role}.`}
        description={`Use a different wallet if you need ${role} access, or continue to this wallet's dashboard.`}
        action={
          <Link
            to={roleDashboardPath[userProfile.role] || "/"}
            className="inline-flex items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open dashboard
          </Link>
        }
      />
    );
  }

  return children;
};
