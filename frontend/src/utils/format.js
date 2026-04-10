const defaultGateway =
  import.meta.env.VITE_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";

export const formatAddress = (address = "") =>
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

export const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(new Date(value));

export const formatVisibility = (visibility = "public") =>
  visibility === "private" ? "Private" : "Public";

export const buildIpfsUrl = (cid) =>
  cid ? `${defaultGateway.replace(/\/$/, "")}/${cid}` : "";

export const getFriendlyError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;
