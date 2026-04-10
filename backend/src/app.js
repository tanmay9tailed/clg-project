import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { env } from "./config/env.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import ipfsRoutes from "./routes/ipfsRoutes.js";
import issuerRoutes from "./routes/issuerRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigins
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ProofRank API is healthy."
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/achievement", achievementRoutes);
app.use("/api/issuer", issuerRoutes);
app.use("/api/ipfs", ipfsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

