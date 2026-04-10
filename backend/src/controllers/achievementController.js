import { Achievement } from "../models/Achievement.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  achievementPayloadSchema,
  achievementVerificationRequestSchema,
  achievementVerificationReviewSchema,
  achievementVisibilitySchema,
  addressParamSchema,
  mongoIdParamSchema
} from "../utils/validators.js";

export const createAchievement = asyncHandler(async (req, res) => {
  const payload = achievementPayloadSchema.parse(req.body);

  if (payload.userAddress !== req.user.address) {
    throw new ApiError(
      403,
      "You can only add achievements for the connected wallet."
    );
  }

  const achievement = await Achievement.create({
    ...payload,
    verified: false,
    verificationRequest: {
      status: "none"
    }
  });

  res.status(201).json({
    success: true,
    data: achievement
  });
});

export const getAchievementsByAddress = asyncHandler(async (req, res) => {
  const { address } = addressParamSchema.parse(req.params);
  const isOwner = req.user?.address === address;

  const query = { userAddress: address };

  if (!isOwner) {
    query.visibility = { $ne: "private" };
  }

  const achievements = await Achievement.find(query).sort({
    createdAt: -1
  });

  res.status(200).json({
    success: true,
    data: achievements
  });
});

export const updateAchievementVisibility = asyncHandler(async (req, res) => {
  const { achievementId } = mongoIdParamSchema.parse(req.params);
  const { visibility } = achievementVisibilitySchema.parse(req.body);

  const achievement = await Achievement.findOne({
    _id: achievementId,
    userAddress: req.user.address
  });

  if (!achievement) {
    throw new ApiError(404, "Achievement not found for this wallet.");
  }

  achievement.visibility = visibility;
  await achievement.save();

  res.status(200).json({
    success: true,
    data: achievement
  });
});

export const deleteAchievement = asyncHandler(async (req, res) => {
  const { achievementId } = mongoIdParamSchema.parse(req.params);

  const achievement = await Achievement.findOneAndDelete({
    _id: achievementId,
    userAddress: req.user.address
  });

  if (!achievement) {
    throw new ApiError(404, "Achievement not found for this wallet.");
  }

  res.status(200).json({
    success: true,
    data: {
      id: achievement._id
    }
  });
});

export const requestAchievementVerification = asyncHandler(async (req, res) => {
  const { achievementId } = mongoIdParamSchema.parse(req.params);
  const payload = achievementVerificationRequestSchema.parse(req.body);

  const achievement = await Achievement.findOne({
    _id: achievementId,
    userAddress: req.user.address
  });

  if (!achievement) {
    throw new ApiError(404, "Achievement not found for this wallet.");
  }

  if (achievement.verified) {
    throw new ApiError(400, "This achievement is already verified.");
  }

  achievement.issuer = payload.issuerName;
  achievement.verificationRequest = {
    status: "pending",
    issuerAddress: payload.issuerAddress,
    issuerName: payload.issuerName,
    note: payload.note,
    requestedAt: new Date(),
    reviewedAt: undefined
  };

  await achievement.save();

  res.status(200).json({
    success: true,
    data: achievement
  });
});

export const getVerificationRequestsForIssuer = asyncHandler(async (req, res) => {
  const requests = await Achievement.find({
    "verificationRequest.issuerAddress": req.user.address,
    "verificationRequest.status": { $in: ["pending", "approved", "rejected"] }
  }).sort({
    "verificationRequest.requestedAt": -1,
    createdAt: -1
  });

  res.status(200).json({
    success: true,
    data: requests
  });
});

export const reviewAchievementVerification = asyncHandler(async (req, res) => {
  const { achievementId } = mongoIdParamSchema.parse(req.params);
  const payload = achievementVerificationReviewSchema.parse(req.body);

  const achievement = await Achievement.findOne({
    _id: achievementId,
    "verificationRequest.issuerAddress": req.user.address
  });

  if (!achievement) {
    throw new ApiError(404, "Verification request not found for this issuer.");
  }

  if (achievement.verificationRequest?.status !== "pending") {
    throw new ApiError(400, "This verification request has already been reviewed.");
  }

  const reviewedAt = new Date();
  const existingRequest =
    achievement.verificationRequest?.toObject?.() || achievement.verificationRequest || {};

  achievement.verified = payload.decision === "approve";
  achievement.verifiedBy =
    payload.decision === "approve" ? req.user.address : achievement.verifiedBy;
  achievement.issuer = payload.issuerName || achievement.issuer;
  achievement.verificationRequest = {
    ...existingRequest,
    issuerAddress: req.user.address,
    issuerName: payload.issuerName || existingRequest.issuerName,
    note: payload.note || existingRequest.note,
    status: payload.decision === "approve" ? "approved" : "rejected",
    reviewedAt
  };

  await achievement.save();

  res.status(200).json({
    success: true,
    data: achievement
  });
});
