import { WalletUser } from "../models/WalletUser.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  authNonceSchema,
  authVerifySchema,
  walletProfileSchema
} from "../utils/validators.js";
import {
  buildAuthMessage,
  generateNonce,
  signAuthToken,
  verifySignedMessage
} from "../services/walletAuthService.js";

export const createNonce = asyncHandler(async (req, res) => {
  const { address } = authNonceSchema.parse(req.body);
  const nonce = generateNonce();

  await WalletUser.findOneAndUpdate(
    { address },
    { address, nonce },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    success: true,
    data: {
      address,
      nonce,
      message: buildAuthMessage(address, nonce)
    }
  });
});

export const verifyWalletSignature = asyncHandler(async (req, res) => {
  const { address, signature } = authVerifySchema.parse(req.body);
  const walletUser = await WalletUser.findOne({ address });

  if (!walletUser) {
    throw new ApiError(404, "Wallet nonce not found. Request a new nonce.");
  }

  const message = buildAuthMessage(address, walletUser.nonce);
  const recoveredAddress = verifySignedMessage(message, signature);

  if (recoveredAddress !== address) {
    throw new ApiError(401, "Signature verification failed.");
  }

  walletUser.nonce = generateNonce();
  walletUser.lastAuthenticatedAt = new Date();
  await walletUser.save();

  const token = signAuthToken(address);

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        address,
        role: walletUser.role,
        organizationName: walletUser.organizationName,
        issuerType: walletUser.issuerType,
        lastAuthenticatedAt: walletUser.lastAuthenticatedAt
      }
    }
  });
});

export const getWalletProfile = asyncHandler(async (req, res) => {
  const walletUser = await WalletUser.findOne({ address: req.user.address });

  if (!walletUser) {
    throw new ApiError(404, "Wallet profile not found.");
  }

  res.status(200).json({
    success: true,
    data: {
      address: walletUser.address,
      role: walletUser.role,
      organizationName: walletUser.organizationName,
      issuerType: walletUser.issuerType,
      lastAuthenticatedAt: walletUser.lastAuthenticatedAt
    }
  });
});

export const updateWalletProfile = asyncHandler(async (req, res) => {
  const payload = walletProfileSchema.parse(req.body);
  const walletUser = await WalletUser.findOne({ address: req.user.address });

  if (!walletUser) {
    throw new ApiError(404, "Wallet profile not found.");
  }

  if (walletUser.role && walletUser.role !== payload.role) {
    throw new ApiError(
      400,
      "This wallet is already bound to a different role. Disconnect and use a different wallet if you need a separate role."
    );
  }

  walletUser.role = payload.role;
  walletUser.organizationName =
    payload.role === "issuer" ? payload.organizationName : undefined;
  walletUser.issuerType =
    payload.role === "issuer" ? payload.issuerType : undefined;

  await walletUser.save();

  res.status(200).json({
    success: true,
    data: {
      address: walletUser.address,
      role: walletUser.role,
      organizationName: walletUser.organizationName,
      issuerType: walletUser.issuerType,
      lastAuthenticatedAt: walletUser.lastAuthenticatedAt
    }
  });
});
