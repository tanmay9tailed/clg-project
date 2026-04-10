import { uploadPdfToPinata } from "../services/pinataService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadCertificatePdf = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Certificate PDF is required.");
  }

  const uploadResult = await uploadPdfToPinata(req.file);

  res.status(200).json({
    success: true,
    data: uploadResult
  });
});

