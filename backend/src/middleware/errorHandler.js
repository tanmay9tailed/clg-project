import multer from "multer";

import { ApiError } from "../utils/apiError.js";

export const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, "Route not found."));
};

export const errorHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Uploaded file is too large."
          : error.message
    });
  }

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error.",
    details: error.details || null
  });
};

