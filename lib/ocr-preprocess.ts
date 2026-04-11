/**
 * Zvětšení + převod na šedou + kontrast pro lepší čitelnost textu v UI s kruhy a barvami (Tesseract).
 */
export async function preprocessImageForOcr(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof document === "undefined") return file;

  try {
    const bmp = await createImageBitmap(file);
    const maxSide = Math.max(bmp.width, bmp.height);
    const scale = Math.min(2.25, 1800 / maxSide);
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return file;

    ctx.drawImage(bmp, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const boosted = Math.min(255, Math.max(0, (gray - 135) * 1.55 + 135));
      d[i] = boosted;
      d[i + 1] = boosted;
      d[i + 2] = boosted;
    }
    ctx.putImageData(imgData, 0, 0);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-ocr.png", { type: "image/png" });
  } catch {
    return file;
  }
}
