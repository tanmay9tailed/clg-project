import { Router } from "express";

import {
  createNonce,
  getWalletProfile,
  updateWalletProfile,
  verifyWalletSignature
} from "../controllers/authController.js";
import { requireWalletAuth } from "../middleware/auth.js";

const router = Router();

router.post("/nonce", createNonce);
router.post("/verify", verifyWalletSignature);
router.get("/me", requireWalletAuth, getWalletProfile);
router.patch("/profile", requireWalletAuth, updateWalletProfile);

export default router;
