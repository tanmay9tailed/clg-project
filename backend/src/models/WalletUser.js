import mongoose from "mongoose";

const walletUserSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    nonce: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["issuer", "receiver"]
    },
    organizationName: {
      type: String,
      trim: true
    },
    issuerType: {
      type: String,
      enum: ["College", "Certificate Provider", "Other"],
      default: "Certificate Provider"
    },
    lastAuthenticatedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const WalletUser = mongoose.model("WalletUser", walletUserSchema);
