// controllers/doctor.controller.ts
import { Request, Response } from "express";
import { Doctor } from "../../models/Doctor.model";
import { User } from "../../models/User.model";
import { AuthUserPayload } from "../../types/index";
import { getErrorMessage } from "../../utils/error.util";

export const completeDoctorIntro = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    await User.findByIdAndUpdate(authUser.userId, { onboardingCompleted: true });
    return res.status(200).json({ success: true, message: "Intro completed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const completeDoctorVerification = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;

    // Typecast req.files for Multer fields
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Extract Cloudinary URLs instantly (No buffers, no RAM bloat!)
    const mcuCertificate = files?.mcuCertificate?.[0]?.path;
    const degreeCertificate = files?.degreeCertificate?.[0]?.path;
    const governmentId = files?.governmentId?.[0]?.path;
    const clinicProof = files?.clinicProof?.[0]?.path; // Optional

    if (!mcuCertificate || !degreeCertificate || !governmentId) {
      return res.status(400).json({
        success: false,
        message: "Required documents (MCU, Degree, Govt ID) are missing"
      });
    }

    const {
      specialization,
      experience,
      registrationNumber,
      registrationCouncil,
      registrationYear
    } = req.body;

    const doctorProfile = await Doctor.findOne({ userId: authUser.userId });
    if (!doctorProfile) {
        return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }

    // Update profile
    doctorProfile.specialization = specialization;
    doctorProfile.experience = experience;
    doctorProfile.registrationNumber = registrationNumber;
    doctorProfile.registrationCouncil = registrationCouncil;
    doctorProfile.registrationYear = registrationYear;
    doctorProfile.documents = { mcuCertificate, degreeCertificate, governmentId, clinicProof };
    doctorProfile.verificationStatus = "pending";

    await doctorProfile.save();

    return res.status(200).json({
      success: true,
      message: "Verification submitted successfully. Admin will review your profile.",
      verificationStatus: "pending",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};
