import axios from "axios";
import FormData from "form-data";

import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

const placeholderJwtValues = new Set([
  "pinata-jwt-token",
  "replace-with-a-fresh-pinata-jwt"
]);

const getPinataErrorMessage = (error) => {
  const data = error.response?.data;

  if (!data) {
    return error.message;
  }

  if (typeof data === "string") {
    return data;
  }

  return data.error || data.message || data.reason || error.message;
};

export const uploadPdfToPinata = async (file) => {
  if (!env.pinataJwt || placeholderJwtValues.has(env.pinataJwt)) {
    throw new ApiError(
      500,
      "Pinata is not configured. Add a fresh PINATA_JWT to backend environment variables and restart the backend."
    );
  }

  const formData = new FormData();

  formData.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype
  });
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: file.originalname
    })
  );

  try {
    const { data } = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${env.pinataJwt}`,
          ...formData.getHeaders()
        }
      }
    );

    return {
      cid: data.IpfsHash,
      gatewayUrl: `${env.pinataGateway.replace(/\/$/, "")}/${data.IpfsHash}`
    };
  } catch (error) {
    const pinataStatus = error.response?.status;
    const pinataMessage = getPinataErrorMessage(error);

    if (pinataStatus === 401 || pinataStatus === 403) {
      throw new ApiError(
        502,
        "Pinata rejected the configured JWT. Revoke the exposed key, create a fresh Pinata JWT with file pinning access, update PINATA_JWT in backend/.env, and restart the backend.",
        { pinataStatus, pinataMessage }
      );
    }

    if (pinataStatus) {
      throw new ApiError(502, `Pinata upload failed with status ${pinataStatus}.`, {
        pinataStatus,
        pinataMessage
      });
    }

    throw new ApiError(502, "Unable to reach Pinata upload API.", {
      reason: error.message
    });
  }
};
