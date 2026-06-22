export interface CloudinaryUploadFile {
  fieldName: string;
  path: string;
  mimeType?: string;
}
export interface CloudinaryUploadJobData {
  entityType: "doctor-verification" | "food-scan" | "MealLog" | "User";
  entityId: string;
  folder: string;
  files: CloudinaryUploadFile[];
}

export interface CloudinaryUploadResult {
  url: string;
  secureUrl?: string;
  publicId: string;
}
