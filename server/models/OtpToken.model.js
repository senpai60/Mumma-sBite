// models/OtpToken.model.js
import mongoose from "mongoose";

const otpTokenSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// optional: unique phone
otpTokenSchema.index({ phone: 1 }, { unique: true });
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 

const OtpToken = mongoose.model("OtpToken", otpTokenSchema);
export default OtpToken;
