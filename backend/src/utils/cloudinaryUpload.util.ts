import cloudinary from "../config/cloudinary";

export const uploadFileToCloudinary = async (filePath: string, folder: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};
