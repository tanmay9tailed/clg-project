import { ethers } from "ethers";

import { CERTIFICATE_ABI } from "./certificateAbi";

export const contractAddress =
  import.meta.env.VITE_CERTIFICATE_CONTRACT_ADDRESS || "";

export const hasContractConfig = Boolean(contractAddress);

const walletProviderFlags = [
  "isBraveWallet",
  "isCoinbaseWallet",
  "isExodus",
  "isFrame",
  "isFrontier",
  "isOkxWallet",
  "isPhantom",
  "isRabby",
  "isTally"
];

const getInjectedProviders = () => {
  if (!window.ethereum) {
    return [];
  }

  if (
    Array.isArray(window.ethereum.providers) &&
    window.ethereum.providers.length
  ) {
    return window.ethereum.providers;
  }

  return [window.ethereum];
};

const isDedicatedMetaMaskProvider = (provider) =>
  Boolean(
    provider?.isMetaMask &&
      !walletProviderFlags.some((flag) => Boolean(provider?.[flag]))
  );

export const getMetaMaskProvider = () => {
  const injectedProviders = getInjectedProviders();

  return (
    injectedProviders.find(isDedicatedMetaMaskProvider) ||
    injectedProviders.find((provider) => provider?.isMetaMask) ||
    null
  );
};

export const hasMetaMaskProvider = () => Boolean(getMetaMaskProvider());

export const getBrowserProvider = () => {
  const injectedProvider = getMetaMaskProvider();

  if (!injectedProvider) {
    throw new Error(
      "MetaMask was not detected. If multiple wallets are installed, open MetaMask and set it as the default wallet extension."
    );
  }

  return new ethers.BrowserProvider(injectedProvider);
};

export const getReadProvider = () => {
  const rpcUrl = import.meta.env.VITE_READ_RPC_URL;

  if (rpcUrl) {
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  const injectedProvider = getMetaMaskProvider();

  if (injectedProvider) {
    return new ethers.BrowserProvider(injectedProvider);
  }

  return null;
};

const getRequiredChainId = () => {
  const configuredChainId = import.meta.env.VITE_REQUIRED_CHAIN_ID;

  if (configuredChainId) {
    return BigInt(configuredChainId);
  }

  const readRpcUrl = import.meta.env.VITE_READ_RPC_URL || "";

  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:8545)?/i.test(readRpcUrl)) {
    return 31337n;
  }

  return null;
};

const toHexChainId = (chainId) => `0x${chainId.toString(16)}`;

const getNetworkSwitchErrorCode = (error) =>
  error?.code || error?.data?.originalError?.code || error?.error?.code;

export const ensureRequiredWalletNetwork = async () => {
  const requiredChainId = getRequiredChainId();

  if (!requiredChainId) {
    return;
  }

  const injectedProvider = getMetaMaskProvider();

  if (!injectedProvider) {
    throw new Error("MetaMask was not detected.");
  }

  const requiredChainIdHex = toHexChainId(requiredChainId);
  const currentChainIdHex = await injectedProvider.request({
    method: "eth_chainId"
  });

  if (BigInt(currentChainIdHex) === requiredChainId) {
    return;
  }

  try {
    await injectedProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: requiredChainIdHex }]
    });
  } catch (switchError) {
    if (getNetworkSwitchErrorCode(switchError) !== 4902) {
      throw new Error(
        `Switch MetaMask to chain ${requiredChainId.toString()} before issuing certificates.`
      );
    }

    const rpcUrl =
      import.meta.env.VITE_READ_RPC_URL || "http://127.0.0.1:8545";

    await injectedProvider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: requiredChainIdHex,
          chainName:
            requiredChainId === 31337n
              ? "Hardhat Local"
              : `Chain ${requiredChainId.toString()}`,
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: [rpcUrl]
        }
      ]
    });
  }
};

export const getCertificateReadContract = () => {
  if (!hasContractConfig) {
    return null;
  }

  const provider = getReadProvider();

  if (!provider) {
    return null;
  }

  return new ethers.Contract(contractAddress, CERTIFICATE_ABI, provider);
};

export const getCertificateWriteContract = async () => {
  if (!hasContractConfig) {
    throw new Error(
      "Contract address is missing. Set VITE_CERTIFICATE_CONTRACT_ADDRESS in the frontend environment."
    );
  }

  await ensureRequiredWalletNetwork();
  const provider = getBrowserProvider();
  const signer = await provider.getSigner();

  return new ethers.Contract(contractAddress, CERTIFICATE_ABI, signer);
};
