import { Request, Response } from "express";
import { Doctor } from "../../models/Doctor.model";
import { User } from "../../models/User.model";
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
    const files = req.files as Record<string, Express.Multer.File[]>;

    // Get Cloudinary URLs from uploaded files
    const mcuCertificate = files?.mcuCertificate?.[0]?.path;
    const degreeCertificate = files?.degreeCertificate?.[0]?.path;
    const governmentId = files?.governmentId?.[0]?.path;
    const clinicProof = files?.clinicProof?.[0]?.path;

    if (!mcuCertificate || !degreeCertificate || !governmentId) {
      return res.status(400).json({ message: "Required documents missing" });
    }

    const { specialization, experience, registrationNumber, registrationCouncil, registrationYear } = req.body;

    const doctorProfile = await Doctor.findOne({ userId: authUser.userId });
    if (!doctorProfile) return res.status(404).json({ message: "Doctor profile not found" });

    doctorProfile.specialization = specialization;
    doctorProfile.experience = Number(experience);
    doctorProfile.registrationNumber = registrationNumber;
    doctorProfile.registrationCouncil = registrationCouncil;
    doctorProfile.registrationYear = Number(registrationYear);
    doctorProfile.documents = { mcuCertificate, degreeCertificate, governmentId, clinicProof };
    doctorProfile.verificationStatus = "pending";

    await doctorProfile.save();

    return res.status(200).json({
      message: "Verification submitted. Admin will review your profile.",
      verificationStatus: "pending",
    });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};
