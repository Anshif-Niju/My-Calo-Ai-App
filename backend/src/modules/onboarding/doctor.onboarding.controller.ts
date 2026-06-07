import { Request, Response } from "express";
import { User } from "../../models/User.model";
import { Doctor } from "../../models/Doctor.model";
import { AuthUserPayload } from "../../types/index";
import { getErrorMessage } from "../../utils/error.util";

export const completeDoctorIntro = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    await User.findByIdAndUpdate(authUser.userId, { onboardingCompleted: true });
    return res.status(200).json({ message: "Intro completed" });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const completeDoctorVerification = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const {
      specialization, experience,
      registrationNumber, registrationCouncil, registrationYear,
      mcuCertificate, degreeCertificate, governmentId, clinicProof,
    } = req.body;

    const doctorProfile = await Doctor.findOne({ userId: authUser.userId });
    if (!doctorProfile) return res.status(404).json({ message: "Doctor profile not found" });

    doctorProfile.specialization      = specialization;
    doctorProfile.experience          = experience;
    doctorProfile.registrationNumber  = registrationNumber;
    doctorProfile.registrationCouncil = registrationCouncil;
    doctorProfile.registrationYear    = registrationYear;
    doctorProfile.documents           = { mcuCertificate, degreeCertificate, governmentId, clinicProof };
    doctorProfile.verificationStatus  = "pending";

    await doctorProfile.save();

    return res.status(200).json({
      message: "Verification submitted. Admin will review your profile.",
      verificationStatus: "pending",
    });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};
