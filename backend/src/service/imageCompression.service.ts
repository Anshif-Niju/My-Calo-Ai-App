import fs from "fs";
import sharp from "sharp";

export const compressImage = async (filepath: string) => {
  const stats = await fs.promises.stat(filepath);

  let image = sharp(filepath);

  // Compress only if > 1.5 MB
  if (stats.size > 1.5 * 1024 * 1024) {
    image = image.resize({
      width: 1024,
      withoutEnlargement: true,
    });
  }

  console.log("✅ Image compression completed");

  return image
    .jpeg({
      quality: 80,
      mozjpeg: true,
    })
    .toBuffer();
};
