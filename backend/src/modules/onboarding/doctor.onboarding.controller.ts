import { Request, Response } from "express";
import { cloudinaryUploadQueue } from "../../jobs/queues/cloudinaryUpload.queue";
import { Doctor } from "../../models/Doctor.model";
import { User } from "../../models/User.model";
import { AuthUserPayload, CloudinaryUploadFile } from "../../types/index";
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

    const doctorProfile = await Doctor.findOne({
      userId: authUser.userId,
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Save doctor details immediately

    doctorProfile.specialization = specialization;
    doctorProfile.experience = Number(experience);
    doctorProfile.registrationNumber = registrationNumber;
    doctorProfile.registrationCouncil = registrationCouncil;
    doctorProfile.registrationYear = Number(registrationYear);
    doctorProfile.verificationStatus = "pending";

    // Save change that doctor uploaded documents

    await User.findByIdAndUpdate(authUser.userId, {
      hasSubmittedVerification: true,
    });

    // Cloudinary URLs will be filled by worker later

    doctorProfile.documents = {
      mcuCertificate: "",
      degreeCertificate: "",
      governmentId: "",
      clinicProof: "",
    };

    await doctorProfile.save();

    // Queue background upload job (generic cloudinary worker)

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

    return res.status(202).json({
      success: true,
      message: "Verification submitted successfully. Admin will review your profile.",
      verificationStatus: "pending",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};
