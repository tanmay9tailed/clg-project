import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState
} from "react";

import { ethers } from "ethers";

import { api } from "../lib/api";
import { APP_NAME } from "../lib/constants";
import { getMetaMaskProvider, hasMetaMaskProvider } from "../lib/contract";
import {
  accountStorageKey,
  profileStorageKey,
  tokenStorageKey
} from "../lib/storage";

const WalletContext = createContext(null);

const clearStoredSession = () => {
  window.localStorage.removeItem(tokenStorageKey);
  window.localStorage.removeItem(accountStorageKey);
  window.localStorage.removeItem(profileStorageKey);
};

const getStoredProfile = () => {
  try {
    const value = window.localStorage.getItem(profileStorageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    window.localStorage.removeItem(profileStorageKey);
    return null;
  }
};

const getWalletErrorMessage = (error, fallback) => {
  const code = error?.code ?? error?.info?.error?.code;
  const rawMessage =
    error?.response?.data?.message ||
    error?.info?.error?.message ||
    error?.shortMessage ||
    error?.message ||
    "";
  const requestUrl =
    error?.config?.url ||
    error?.request?.responseURL ||
    "";

  if (code === 4001) {
    return "Wallet request was rejected in MetaMask.";
  }

  if (code === -32002) {
    return "MetaMask already has a pending connection request. Open the extension and finish or cancel it first.";
  }

  if (
    rawMessage.toLowerCase().includes("unexpected error") ||
    rawMessage.toLowerCase().includes("selectextension") ||
    rawMessage.toLowerCase().includes("evmask")
  ) {
    return "The injected wallet provider failed before MetaMask could respond. If multiple wallet extensions are installed, disable the others temporarily or set MetaMask as the default wallet, then reload and try again.";
  }

  if (
    code === "ERR_NETWORK" ||
    rawMessage.toLowerCase().includes("network error") ||
    rawMessage.toLowerCase().includes("err_connection_refused")
  ) {
    return `The backend API is not reachable${requestUrl ? ` at ${requestUrl}` : ""}. Start the Express server on http://localhost:5000 and try again.`;
  }

  return rawMessage || fallback;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(
    () => window.localStorage.getItem(accountStorageKey) || ""
  );
  const [token, setToken] = useState(
    () => window.localStorage.getItem(tokenStorageKey) || ""
  );
  const [userProfile, setUserProfile] = useState(getStoredProfile);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState("");

  const buildBrowserProvider = () => {
    const injectedProvider = getMetaMaskProvider();

    if (!injectedProvider) {
      throw new Error(
        "MetaMask was not detected. If you have multiple wallet extensions installed, make MetaMask the active/default extension and try again."
      );
    }

    return new ethers.BrowserProvider(injectedProvider);
  };

  const disconnectWallet = () => {
    clearStoredSession();
    setToken("");
    setAccount("");
    setUserProfile(null);
    setSigner(null);
    setError("");
  };

  const persistSession = (nextAccount, nextToken, nextProfile) => {
    window.localStorage.setItem(accountStorageKey, nextAccount);
    window.localStorage.setItem(tokenStorageKey, nextToken);
    setAccount(nextAccount);
    setToken(nextToken);

    if (nextProfile) {
      window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      setUserProfile(nextProfile);
    }
  };

  const persistProfile = (nextProfile) => {
    if (!nextProfile) {
      window.localStorage.removeItem(profileStorageKey);
      setUserProfile(null);
      return;
    }

    window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
    setUserProfile(nextProfile);
  };

  const refreshWalletProfile = async () => {
    if (!window.localStorage.getItem(tokenStorageKey)) {
      return null;
    }

    const { data } = await api.get("/auth/me");
    persistProfile(data.data);
    return data.data;
  };

  const updateWalletProfile = async (payload) => {
    const { data } = await api.patch("/auth/profile", payload);
    persistProfile(data.data);
    return data.data;
  };

  const authenticateWallet = async (providerInstance, selectedAccount) => {
    setIsAuthenticating(true);
    setError("");

    try {
      const nextProvider = providerInstance || buildBrowserProvider();
      const nextSigner = await nextProvider.getSigner();
      const address = (selectedAccount || (await nextSigner.getAddress())).toLowerCase();
      const nonceResponse = await api.post("/auth/nonce", { address });
      const signature = await nextSigner.signMessage(nonceResponse.data.data.message);
      const verifyResponse = await api.post("/auth/verify", { address, signature });

      persistSession(
        address,
        verifyResponse.data.data.token,
        verifyResponse.data.data.user
      );
      setProvider(nextProvider);
      setSigner(nextSigner);
      return address;
    } catch (authError) {
      clearStoredSession();
      setAccount("");
      setToken("");
      setUserProfile(null);
      setSigner(null);
      setError(
        getWalletErrorMessage(
          authError,
          `Wallet authentication failed for ${APP_NAME}.`
        )
      );
      throw authError;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const connectWallet = async () => {
    if (!hasMetaMaskProvider()) {
      setError(
        "MetaMask is required to connect your wallet. If another wallet extension is active, switch the browser's default wallet back to MetaMask."
      );
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      const nextProvider = buildBrowserProvider();
      const accounts = await nextProvider.send("eth_requestAccounts", []);

      if (!accounts.length) {
        throw new Error("MetaMask did not return any accounts.");
      }

      const selectedAccount = ethers.getAddress(accounts[0]).toLowerCase();

      return await authenticateWallet(nextProvider, selectedAccount);
    } catch (connectError) {
      setError(getWalletErrorMessage(connectError, "Wallet connection failed."));
      return "";
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!hasMetaMaskProvider()) {
      return undefined;
    }

    const injectedProvider = getMetaMaskProvider();
    const nextProvider = new ethers.BrowserProvider(injectedProvider);
    setProvider(nextProvider);

    const syncWallet = async () => {
      const accounts = await nextProvider.send("eth_accounts", []);

      if (!accounts.length) {
        disconnectWallet();
        return;
      }

      const nextAccount = ethers.getAddress(accounts[0]).toLowerCase();
      const nextSigner = await nextProvider.getSigner();

      startTransition(() => {
        setAccount(nextAccount);
        setSigner(nextSigner);
      });
    };

    const handleAccountsChanged = async (accounts) => {
      if (!accounts.length) {
        disconnectWallet();
        return;
      }

      const nextAccount = ethers.getAddress(accounts[0]).toLowerCase();
      const storedAccount = window.localStorage.getItem(accountStorageKey);
      const nextSigner = await nextProvider.getSigner();

      setSigner(nextSigner);
      setAccount(nextAccount);

      if (storedAccount && storedAccount !== nextAccount) {
        clearStoredSession();
        setToken("");
        setUserProfile(null);
        setError("Wallet changed. Re-verify to continue making authenticated actions.");
      }
    };

    const handleChainChanged = () => window.location.reload();

    syncWallet().catch(() => {});
    injectedProvider.on("accountsChanged", handleAccountsChanged);
    injectedProvider.on("chainChanged", handleChainChanged);

    return () => {
      injectedProvider.removeListener("accountsChanged", handleAccountsChanged);
      injectedProvider.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (!account || !token) {
      return;
    }

    refreshWalletProfile().catch(() => {});
  }, [account, token]);

  const value = {
    account,
    authenticated: Boolean(account && token),
    connectWallet,
    disconnectWallet,
    authenticateWallet,
    error,
    hasMetaMask: hasMetaMaskProvider(),
    isAuthenticating,
    isConnecting,
    provider,
    refreshWalletProfile,
    signer,
    token,
    updateWalletProfile,
    userProfile
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWalletContext must be used inside WalletProvider.");
  }

  return context;
};
