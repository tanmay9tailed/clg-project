import multer from "multer";

import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, callback) => {
  if (
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf")
  ) {
    callback(null, true);
    return;
  }

  callback(new ApiError(400, "Only PDF certificates can be uploaded."));
};

export const uploadCertificate = multer({
  storage,
  limits: {
    fileSize: env.maxFileSizeBytes
  },
  fileFilter
});

