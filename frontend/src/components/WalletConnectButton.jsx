import { formatAddress } from "../utils/format";
import { useWallet } from "../hooks/useWallet";

const baseButtonClass =
  "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-400";

export const WalletConnectButton = ({ className = "" }) => {
  const {
    account,
    authenticated,
    connectWallet,
    disconnectWallet,
    hasMetaMask,
    isAuthenticating,
    isConnecting
  } = useWallet();

  const handleDisconnect = () => {
    const confirmed = window.confirm("Are you sure you want to disconnect this wallet?");

    if (confirmed) {
      disconnectWallet();
    }
  };

  if (!hasMetaMask) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
        className={`${baseButtonClass} bg-slate-900 text-white ${className}`}
      >
        Install MetaMask
      </a>
    );
  }

  if (account && authenticated) {
    return (
      <button
        type="button"
        onClick={handleDisconnect}
        className={`${baseButtonClass} border border-slate-300 bg-white text-slate-900 ${className}`}
      >
        {formatAddress(account)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={connectWallet}
      disabled={isConnecting || isAuthenticating}
      className={`${baseButtonClass} bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {isConnecting || isAuthenticating ? "Connecting..." : "Connect Wallet"}
    </button>
  );
};
