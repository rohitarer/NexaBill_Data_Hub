import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';


export async function processImage(inputPath, outputPath) {
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await sharp(inputPath)
.resize(800, 800, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
.jpeg({ quality: 90 })
.toFile(outputPath);
}