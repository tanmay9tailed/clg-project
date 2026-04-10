import { IssuedCertificate } from "../models/IssuedCertificate.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addressParamSchema,
  certificateVisibilitySchema,
  issuerRecordSchema,
  mongoIdParamSchema
} from "../utils/validators.js";

export const getIssuedCertificates = asyncHandler(async (req, res) => {
  const { address } = addressParamSchema.parse(req.params);

  if (req.user.address !== address) {
    throw new ApiError(403, "You can only view certificates issued by your wallet.");
  }

  const issuedCertificates = await IssuedCertificate.find({
    issuerAddress: address
  }).sort({ issuedAt: -1 });

  res.status(200).json({
    success: true,
    data: issuedCertificates
  });
});

export const getReceivedCertificates = asyncHandler(async (req, res) => {
  const { address } = addressParamSchema.parse(req.params);
  const isOwner = req.user?.address === address;

  const query = {
    studentAddress: address
  };

  if (!isOwner) {
    query.visibility = "public";
  }

  const receivedCertificates = await IssuedCertificate.find(query).sort({
    issuedAt: -1
  });

  res.status(200).json({
    success: true,
    data: receivedCertificates
  });
});

export const recordIssuedCertificate = asyncHandler(async (req, res) => {
  const payload = issuerRecordSchema.parse(req.body);

  if (payload.issuerAddress !== req.user.address) {
    throw new ApiError(
      403,
      "Issued certificate record must match the authenticated wallet."
    );
  }

  const issuedCertificate = await IssuedCertificate.create(payload);

  res.status(201).json({
    success: true,
    data: issuedCertificate
  });
});

export const updateReceivedCertificateVisibility = asyncHandler(async (req, res) => {
  const { certificateId } = mongoIdParamSchema.parse(req.params);
  const { visibility } = certificateVisibilitySchema.parse(req.body);

  const issuedCertificate = await IssuedCertificate.findOne({
    _id: certificateId,
    studentAddress: req.user.address
  });

  if (!issuedCertificate) {
    throw new ApiError(404, "Issued credential not found for this wallet.");
  }

  issuedCertificate.visibility = visibility;
  await issuedCertificate.save();

  res.status(200).json({
    success: true,
    data: issuedCertificate
  });
});
