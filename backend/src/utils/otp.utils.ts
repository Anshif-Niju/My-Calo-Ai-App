import crypto from "crypto";

export const generateOTP = (): string => {
  // Generates a random integer between 100000 and 999999
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};


// otp utils
