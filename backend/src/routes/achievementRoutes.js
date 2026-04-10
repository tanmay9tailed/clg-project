import { Router } from "express";

import {
  createAchievement,
  deleteAchievement,
  getAchievementsByAddress,
  getVerificationRequestsForIssuer,
  requestAchievementVerification,
  reviewAchievementVerification,
  updateAchievementVisibility
} from "../controllers/achievementController.js";
import { optionalWalletAuth, requireWalletAuth } from "../middleware/auth.js";

const router = Router();

router.post("/add", requireWalletAuth, createAchievement);
router.get("/issuer/requests", requireWalletAuth, getVerificationRequestsForIssuer);
router.post(
  "/:achievementId/request-verification",
  requireWalletAuth,
  requestAchievementVerification
);
router.patch(
  "/:achievementId/verification-review",
  requireWalletAuth,
  reviewAchievementVerification
);
router.patch("/:achievementId/visibility", requireWalletAuth, updateAchievementVisibility);
router.delete("/:achievementId", requireWalletAuth, deleteAchievement);
router.get("/:address", optionalWalletAuth, getAchievementsByAddress);

export default router;
