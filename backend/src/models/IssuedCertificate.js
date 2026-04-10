import mongoose from "mongoose";

const issuedCertificateSchema = new mongoose.Schema(
  {
    issuerAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    issuerName: {
      type: String,
      required: true,
      trim: true
    },
    issuerType: {
      type: String,
      required: true,
      enum: ["College", "Certificate Provider", "Other"],
      default: "Certificate Provider"
    },
    studentAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    certId: {
      type: String,
      required: true,
      trim: true
    },
    cid: {
      type: String,
      required: true,
      trim: true
    },
    gatewayUrl: {
      type: String,
      required: true,
      trim: true
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private"
    },
    documentHash: {
      type: String,
      required: true,
      trim: true
    },
    signatureMessage: {
      type: String,
      required: true,
      trim: true
    },
    issuerSignature: {
      type: String,
      required: true,
      trim: true
    },
    transactionHash: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

issuedCertificateSchema.index({ issuerAddress: 1, issuedAt: -1 });
issuedCertificateSchema.index({ studentAddress: 1, issuedAt: -1 });

export const IssuedCertificate = mongoose.model(
  "IssuedCertificate",
  issuedCertificateSchema
);
