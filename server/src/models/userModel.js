import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const investorProfileSchema = new mongoose.Schema(
  {
    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    accreditationStatus: {
      type: String,
      enum: ["none", "accredited", "non_accredited"],
      default: "none",
    },
    riskProfile: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const platformUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email address."],
    },
    password: { type: String, required: true, minlength: 8 },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformRole",
      required: true,
    },
    phone: { type: String, trim: true },
    country: { type: String, trim: true },
    investorProfile: investorProfileSchema,
    identityDocuments: [
      {
        docType: {
          type: String,
          enum: ["NID", "Driving License", "Passport"],
          required: true,
        },
        docNumber: { type: String, required: true, trim: true },
        fileUrl: { type: String, required: true, trim: true },
        uploadedAt: { type: Date, default: Date.now },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date }
      },
    ],
    otherDocuments: [
      {
        docType: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    profilePhoto: {
      url: { type: String },
      publicId: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, select: false },
    deletedAt: { type: Date, default: null, select: false },
    passwordResetToken: String,
    passwordResetExpires: Date,
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
    otpCode: { type: String, select: false },
    otpExpiry: { type: Date },
    otpStatus: {
      type: String,
      enum: ["pending", "verified", "expired"],
      default: "pending",
    },
    isSystem: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strict: "throw",
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

platformUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

platformUserSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

platformUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const PlatformUser = mongoose.model("PlatformUser", platformUserSchema);
