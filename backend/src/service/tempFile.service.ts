import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const TEMP_DIR = path.join(process.cwd(), "uploads", "temp", "food-scanning");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, {
    recursive: true,
  });
}

export const saveTempImage = async (buffer: Buffer, ext: string) => {
  const filename = `${uuid()}${ext}`;

  const filepath = path.join(TEMP_DIR, filename);

  await fs.promises.writeFile(filepath, buffer);

  console.log(`✅ Temporary file created: ${filename}`);

  return filepath;
};

export const deleteTempImage = async (filepath: string) => {
  try {
    const exists = fs.existsSync(filepath);

    if (!exists) return;

    await fs.promises.unlink(filepath);

    console.log(`\n 🗑️ Deleted temp file: ${path.basename(filepath)}`);
  } catch (error) {
    console.error("\n Temp file deletion failed:", error);
  }
};
