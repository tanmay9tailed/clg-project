import dotenv from "dotenv";

dotenv.config();

const parseOrigins = (value) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  port: Number(process.env.PORT || 5000),
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/proofrank-wallet",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN || "http://localhost:5173"),
  pinataJwt: process.env.PINATA_JWT || "",
  pinataGateway: process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs",
  authMessageDomain: process.env.AUTH_MESSAGE_DOMAIN || "ProofRank Wallet",
  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024
};

