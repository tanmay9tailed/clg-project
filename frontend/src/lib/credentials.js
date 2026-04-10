import { api, publicApi } from "./api";
import { getCertificateReadContract } from "./contract";
import { rankCredentials } from "../utils/ranking";
import { buildIpfsUrl } from "../utils/format";

const issuedCredentialKey = (certId, cid) => `${certId}::${cid}`;

export const fetchAchievements = async (address, options = {}) => {
  const client = options.publicOnly ? publicApi : api;
  const { data } = await client.get(`/achievement/${address.toLowerCase()}`);
  return data.data;
};

export const fetchIssuedCertificatesByIssuer = async (address) => {
  const { data } = await api.get(`/issuer/${address.toLowerCase()}`);
  return data.data;
};

export const fetchReceivedCertificates = async (address, options = {}) => {
  const client = options.publicOnly ? publicApi : api;
  const { data } = await client.get(`/issuer/received/${address.toLowerCase()}`);
  return data.data;
};

export const fetchBlockchainCertificates = async (address) => {
  const contract = getCertificateReadContract();

  if (!contract) {
    return [];
  }

  const certificates = await contract.getCertificates(address);
  return certificates;
};

export const normalizeAchievement = (achievement) => ({
  id: achievement._id,
  source: "achievement",
  title: achievement.title,
  issuer: achievement.issuer,
  description: achievement.description,
  link: achievement.link,
  previewImage: achievement.previewImage,
  type: achievement.type,
  verified: Boolean(achievement.verified),
  visibility: achievement.visibility || "public",
  verificationRequest: achievement.verificationRequest || { status: "none" },
  verificationRequestStatus: achievement.verificationRequest?.status || "none",
  verifiedBy: achievement.verifiedBy,
  createdAt: achievement.createdAt,
  raw: achievement
});

export const normalizeIssuedCredential = (record, chainCertificate, index = 0) => {
  const certId = record?.certId || chainCertificate?.certId || "Issued Credential";
  const cid = record?.cid || chainCertificate?.cid || "";
  const timestamp =
    record?.issuedAt ||
    (chainCertificate?.timestamp
      ? new Date(Number(chainCertificate.timestamp) * 1000).toISOString()
      : new Date().toISOString());

  return {
    id: record?._id || `${certId}-${cid}-${index}`,
    source: "issued",
    title: certId,
    issuer: record?.issuerName || chainCertificate?.issuer || "Verified issuer",
    issuerAddress: record?.issuerAddress || chainCertificate?.issuer,
    issuerType: record?.issuerType || "Certificate Provider",
    description:
      "Issuer-signed credential stored on IPFS and anchored on-chain for verifiable proof.",
    link: record?.gatewayUrl || buildIpfsUrl(cid),
    type: "Certification",
    verified: true,
    visibility: record?.visibility || "private",
    documentHash: record?.documentHash,
    issuerSignature: record?.issuerSignature,
    signatureMessage: record?.signatureMessage,
    transactionHash: record?.transactionHash,
    cid,
    createdAt: timestamp,
    raw: {
      record,
      chainCertificate
    }
  };
};

const mergeIssuedCredentials = (blockchainCertificates = [], issuedRecords = []) => {
  const chainByKey = new Map(
    blockchainCertificates.map((certificate) => [
      issuedCredentialKey(certificate.certId, certificate.cid),
      certificate
    ])
  );
  const seenKeys = new Set();

  const mergedRecords = issuedRecords.map((record, index) => {
    const key = issuedCredentialKey(record.certId, record.cid);
    seenKeys.add(key);
    return normalizeIssuedCredential(record, chainByKey.get(key), index);
  });

  const chainOnlyRecords = blockchainCertificates
    .filter((certificate) => !seenKeys.has(issuedCredentialKey(certificate.certId, certificate.cid)))
    .map((certificate, index) =>
      normalizeIssuedCredential(null, certificate, issuedRecords.length + index)
    );

  return [...mergedRecords, ...chainOnlyRecords];
};

const sortByNewest = (credentials) =>
  [...credentials].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

export const combineCredentials = (
  achievements = [],
  blockchainCertificates = [],
  issuedRecords = [],
  options = {}
) => {
  const includePrivate = options.includePrivate ?? true;

  return [
    ...achievements.map(normalizeAchievement),
    ...mergeIssuedCredentials(blockchainCertificates, issuedRecords)
  ].filter((credential) => includePrivate || credential.visibility !== "private");
};

export const combineAndRankCredentials = (
  achievements = [],
  blockchainCertificates = [],
  issuedRecords = [],
  options = {}
) => rankCredentials(
  combineCredentials(achievements, blockchainCertificates, issuedRecords, options)
);

export const combineDashboardCredentials = (
  achievements = [],
  blockchainCertificates = [],
  issuedRecords = [],
  options = {}
) => sortByNewest(
  combineCredentials(achievements, blockchainCertificates, issuedRecords, options)
);

export const deleteAchievement = async (achievementId) => {
  const { data } = await api.delete(`/achievement/${achievementId}`);
  return data.data;
};

export const updateAchievementVisibility = async (achievementId, visibility) => {
  const { data } = await api.patch(`/achievement/${achievementId}/visibility`, {
    visibility
  });
  return data.data;
};

export const updateReceivedCredentialVisibility = async (
  certificateId,
  visibility
) => {
  const { data } = await api.patch(
    `/issuer/received/${certificateId}/visibility`,
    {
      visibility
    }
  );
  return data.data;
};

export const requestAchievementVerification = async (achievementId, payload) => {
  const { data } = await api.post(
    `/achievement/${achievementId}/request-verification`,
    payload
  );
  return data.data;
};

export const fetchIssuerVerificationRequests = async () => {
  const { data } = await api.get("/achievement/issuer/requests");
  return data.data;
};

export const reviewAchievementVerification = async (achievementId, payload) => {
  const { data } = await api.patch(
    `/achievement/${achievementId}/verification-review`,
    payload
  );
  return data.data;
};
