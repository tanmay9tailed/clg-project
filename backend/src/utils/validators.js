import { z } from "zod";

const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum wallet address.")
  .transform((value) => value.toLowerCase());

const optionalUrlSchema = z
  .union([z.string().trim().url(), z.literal(""), z.undefined()])
  .transform((value) => value || undefined);

const optionalTxHashSchema = z
  .union([
    z.string().regex(/^0x([A-Fa-f0-9]{64})$/, "Invalid transaction hash."),
    z.literal(""),
    z.undefined()
  ])
  .transform((value) => value || undefined);

const optionalTextSchema = z
  .union([z.string().trim().max(300), z.literal(""), z.undefined()])
  .transform((value) => value || undefined);

const visibilitySchema = z.enum(["public", "private"]);

const mongoIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid record id.");

export const authNonceSchema = z.object({
  address: ethereumAddressSchema
});

export const authVerifySchema = z.object({
  address: ethereumAddressSchema,
  signature: z.string().min(10, "Signature is required.")
});

export const walletProfileSchema = z
  .object({
    role: z.enum(["issuer", "receiver"]),
    organizationName: z
      .union([z.string().trim().min(2).max(120), z.literal(""), z.undefined()])
      .transform((value) => value || undefined),
    issuerType: z
      .enum(["College", "Certificate Provider", "Other"])
      .default("Certificate Provider")
  })
  .superRefine((value, context) => {
    if (value.role === "issuer" && !value.organizationName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Organization name is required for issuer profiles.",
        path: ["organizationName"]
      });
    }
  });

export const achievementPayloadSchema = z.object({
  title: z.string().trim().min(2).max(120),
  issuer: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(600),
  link: optionalUrlSchema,
  previewImage: optionalUrlSchema,
  type: z
    .enum([
      "Academic",
      "Competition",
      "Leadership",
      "Certification",
      "Research",
      "Open Source",
      "Volunteer",
      "Other"
    ])
    .default("Other"),
  visibility: visibilitySchema.default("public"),
  userAddress: ethereumAddressSchema
});

export const achievementVisibilitySchema = z.object({
  visibility: visibilitySchema
});

export const achievementVerificationRequestSchema = z.object({
  issuerAddress: ethereumAddressSchema,
  issuerName: z.string().trim().min(2).max(120),
  note: optionalTextSchema
});

export const achievementVerificationReviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  issuerName: z
    .union([z.string().trim().min(2).max(120), z.literal(""), z.undefined()])
    .transform((value) => value || undefined),
  note: optionalTextSchema
});

export const issuerRecordSchema = z.object({
  issuerAddress: ethereumAddressSchema,
  issuerName: z.string().trim().min(2).max(120),
  issuerType: z
    .enum(["College", "Certificate Provider", "Other"])
    .default("Certificate Provider"),
  studentAddress: ethereumAddressSchema,
  certId: z.string().trim().min(2).max(120),
  cid: z.string().trim().min(10).max(255),
  gatewayUrl: z.string().trim().url(),
  visibility: visibilitySchema.default("private"),
  documentHash: z
    .string()
    .trim()
    .regex(/^[A-Fa-f0-9]{64}$/, "Document hash must be a SHA-256 hex string."),
  signatureMessage: z.string().trim().min(20).max(500),
  issuerSignature: z.string().trim().min(20),
  transactionHash: optionalTxHashSchema
});

export const certificateVisibilitySchema = z.object({
  visibility: visibilitySchema
});

export const addressParamSchema = z.object({
  address: ethereumAddressSchema
});

export const mongoIdParamSchema = z.object({
  achievementId: mongoIdSchema.optional(),
  certificateId: mongoIdSchema.optional()
});
