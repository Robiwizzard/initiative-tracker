import { MAX_ICON_CHARS } from "../shared/images";

const SIZE = 96;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Reads an image file and returns a small PNG data URL (96px, transparency kept). */
export async function fileToIconDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file is not an image.");
  if (file.size > MAX_FILE_BYTES) throw new Error("That image is larger than 5 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = url;
    });
    const w = img.naturalWidth || SIZE;
    const h = img.naturalHeight || SIZE;
    const scale = Math.min(SIZE / w, SIZE / h);
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that image.");
    const dw = w * scale;
    const dh = h * scale;
    ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
    const out = canvas.toDataURL("image/png");
    if (out.length > MAX_ICON_CHARS) throw new Error("That image is too detailed to store. Try a simpler one.");
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
