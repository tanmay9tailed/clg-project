import crypto from "crypto";

import { ethers } from "ethers";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export const generateNonce = () => crypto.randomBytes(16).toString("hex");

export const buildAuthMessage = (address, nonce) =>
  [
    `${env.authMessageDomain} wallet authentication`,
    "",
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
    "",
    "Sign this message to verify wallet ownership without revealing your private key."
  ].join("\n");

export const verifySignedMessage = (message, signature) =>
  ethers.verifyMessage(message, signature).toLowerCase();

export const signAuthToken = (address) =>
  jwt.sign({ address }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

