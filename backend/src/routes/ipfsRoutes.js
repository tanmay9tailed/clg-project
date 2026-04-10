import { Router } from "express";

import { uploadCertificatePdf } from "../controllers/ipfsController.js";
import { requireWalletAuth } from "../middleware/auth.js";
import { uploadCertificate } from "../middleware/upload.js";

const router = Router();

router.post(
  "/upload-certificate",
  requireWalletAuth,
  uploadCertificate.single("certificate"),
  uploadCertificatePdf
);

export default router;

