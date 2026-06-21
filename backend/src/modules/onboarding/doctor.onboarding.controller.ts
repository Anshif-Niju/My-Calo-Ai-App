import { Request, Response } from "express";
import { cloudinaryUploadQueue } from "../../jobs/queues/cloudinaryUpload.queue";
import { DoctorVerification } from "../../models/Doctor.Verification.model";
import { User } from "../../models/User.model";
import { AuthUserPayload, CloudinaryUploadFile } from "../../types/index";
import { generateAccessToken } from "../auth/auth.tokens";
import { setAccessTokenCookie } from "../auth/auth.cookies";

export const completeDoctorIntro = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const updatedUser = await User.findByIdAndUpdate(
      authUser.userId,
      { onboardingCompleted: true },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Re-issue access token so the middleware cookie reflects onboardingCompleted: true
    const newAccessToken = generateAccessToken(
      updatedUser._id.toString(),
      updatedUser.role,
      updatedUser.email,
      true,
      updatedUser.hasSubmittedVerification,
      "not_submitted"
    );
    setAccessTokenCookie(res, newAccessToken);

    return res.status(200).json({ success: true, message: "Intro completed", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error });
  }
};

export const completeDoctorVerification = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const mcuPath = files?.mcuCertificate?.[0]?.path;
    const degreePath = files?.degreeCertificate?.[0]?.path;
    const governmentIdPath = files?.governmentId?.[0]?.path;
    const clinicProofPath = files?.clinicProof?.[0]?.path;

    if (!mcuPath || !degreePath || !governmentIdPath) {
      return res.status(400).json({
        success: false,
        message: "Required documents (MCU, Degree, Govt ID) are missing",
      });
    }

    const { specialization, experience, registrationNumber, registrationCouncil, registrationYear } = req.body;

    const doctorProfile = await DoctorVerification.findOne({
      userId: authUser.userId,
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    doctorProfile.specialization = specialization;
    doctorProfile.experience = Number(experience);
    doctorProfile.registrationNumber = registrationNumber;
    doctorProfile.registrationCouncil = registrationCouncil;
    doctorProfile.registrationYear = Number(registrationYear);
    doctorProfile.verificationStatus = "pending";

    const updatedUser = await User.findByIdAndUpdate(
      authUser.userId,
      { hasSubmittedVerification: true },
      { new: true }
    ).select("-password");

    doctorProfile.documents = {
      mcuCertificate: "",
      degreeCertificate: "",
      governmentId: "",
      clinicProof: "",
    };

    await doctorProfile.save();

    const uploadFiles: CloudinaryUploadFile[] = [
      { fieldName: "mcuCertificate", path: mcuPath },
      { fieldName: "degreeCertificate", path: degreePath },
      { fieldName: "governmentId", path: governmentIdPath },
      ...(clinicProofPath ? [{ fieldName: "clinicProof", path: clinicProofPath }] : []),
    ];

    await cloudinaryUploadQueue.add("upload-documents", {
      entityType: "doctor-verification",
      entityId: doctorProfile._id.toString(),
      folder: "MyCalo AI/Doctor/Verification",
      files: uploadFiles,
    });

    // Re-issue access token so middleware cookie reflects hasSubmittedVerification: true
    if (updatedUser) {
      const newAccessToken = generateAccessToken(
        updatedUser._id.toString(),
        updatedUser.role,
        updatedUser.email,
        updatedUser.onboardingCompleted,
        true,
        "pending"
      );
      setAccessTokenCookie(res, newAccessToken);
    }

    return res.status(202).json({
      success: true,
      message: "Verification submitted successfully. Admin will review your profile.",
      verificationStatus: "pending",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
};
