import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    issuer: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    link: {
      type: String,
      trim: true
    },
    previewImage: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      required: true,
      trim: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: String,
      lowercase: true
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    },
    verificationRequest: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none"
      },
      issuerAddress: {
        type: String,
        lowercase: true
      },
      issuerName: {
        type: String,
        trim: true
      },
      note: {
        type: String,
        trim: true
      },
      requestedAt: {
        type: Date
      },
      reviewedAt: {
        type: Date
      }
    },
    userAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

achievementSchema.index({ userAddress: 1, createdAt: -1 });
achievementSchema.index({
  "verificationRequest.issuerAddress": 1,
  "verificationRequest.status": 1,
  createdAt: -1
});

export const Achievement = mongoose.model("Achievement", achievementSchema);
