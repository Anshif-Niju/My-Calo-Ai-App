import crypto from "crypto";

export const generateOTP = (): string => {
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};


