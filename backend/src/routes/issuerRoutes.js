import { Router } from "express";

import {
  getReceivedCertificates,
  getIssuedCertificates,
  recordIssuedCertificate,
  updateReceivedCertificateVisibility
} from "../controllers/issuerController.js";
import { optionalWalletAuth, requireWalletAuth } from "../middleware/auth.js";

const router = Router();

router.get("/received/:address", optionalWalletAuth, getReceivedCertificates);
router.patch(
  "/received/:certificateId/visibility",
  requireWalletAuth,
  updateReceivedCertificateVisibility
);
router.get("/:address", requireWalletAuth, getIssuedCertificates);
router.post("/record", requireWalletAuth, recordIssuedCertificate);

export default router;
