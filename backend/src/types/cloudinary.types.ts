export interface CloudinaryUploadFile {
  fieldName: string;
  path: string;
}
export interface CloudinaryUploadJobData {
  entityType: "doctor-verification" | "food-scan";
  entityId: string;
  folder: string;
  files: CloudinaryUploadFile[];
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}
