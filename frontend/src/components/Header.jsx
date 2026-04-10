import { NavLink } from "react-router-dom";

import { WalletConnectButton } from "./WalletConnectButton";
import { useWallet } from "../hooks/useWallet";

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
  }`;

export const Header = () => {
  const { account, userProfile } = useWallet();
  const dashboardPath = userProfile?.role === "issuer" ? "/issuer" : "/dashboard";
  const navItems = [
    { label: "Start", to: "/" },
    { label: "Dashboard", to: dashboardPath },
    ...(userProfile?.role === "receiver"
      ? [{ label: "Add Achievement", to: "/achievements/new" }]
      : [])
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <NavLink to="/" className="font-display text-xl font-bold tracking-tight text-slate-950">
            ProofRank Wallet
          </NavLink>
          <div className="lg:hidden">
            <WalletConnectButton />
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          {account ? (
            <NavLink to={`/u/${account}`} className={linkClass}>
              Public Profile
            </NavLink>
          ) : null}
        </nav>

        <div className="hidden lg:block">
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
};
