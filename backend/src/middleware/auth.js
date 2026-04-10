import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

const decodeWalletToken = (token) => {
  const decoded = jwt.verify(token, env.jwtSecret);

  return {
    address: decoded.address.toLowerCase()
  };
};

export const requireWalletAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing wallet authorization token."));
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = decodeWalletToken(token);
    next();
  } catch (error) {
    next(new ApiError(401, "Wallet session expired or invalid."));
  }
};

export const optionalWalletAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = decodeWalletToken(token);
  } catch (error) {
    req.user = undefined;
  }

  next();
};
