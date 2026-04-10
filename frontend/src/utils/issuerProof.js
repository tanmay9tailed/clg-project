export const hashFileSha256 = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const digest = await window.crypto.subtle.digest("SHA-256", arrayBuffer);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const buildIssuerSignatureMessage = ({
  issuerName,
  issuerType,
  certId,
  studentAddress,
  documentHash
}) =>
  [
    "ProofRank Credential Document Verification",
    "",
    `Issuer: ${issuerName}`,
    `Issuer Type: ${issuerType}`,
    `Certificate ID: ${certId}`,
    `Receiver Wallet: ${studentAddress.toLowerCase()}`,
    `Document SHA-256: ${documentHash}`,
    "",
    "I confirm this uploaded credential document is authentic and intentionally issued to the receiver above."
  ].join("\n");
