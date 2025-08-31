// server/utils/fileUtils.js
import slugify from 'slugify';
import path from 'path';
import fs from 'fs/promises';

/**
 * Slugifies a product name for safe filenames (no spaces/special chars).
 * Returns something like "parle-g-biscuit" (no extension).
 */
export function getSafeFileName(name) {
  const base = slugify(name || 'product', { lower: true, strict: true, trim: true });
  return base || 'product';
}

/**
 * Ensures the directory for a file path exists.
 * e.g., await ensureDir('server/uploads/foo.jpg')
 */
export async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

/**
 * Optionally, generate a unique filename with timestamp.
 * Not used directly, but handy if you need it later.
 */
export function withTimestamp(base, ext = '.jpg') {
  return `${base}-${Date.now()}${ext}`;
}


// import slugify from 'slugify';
// import path from 'path';


// export function safeFilename(originalName) {
// const ext = path.extname(originalName).toLowerCase() || '.jpg';
// const base = path.basename(originalName, ext);
// const slug = slugify(base, { lower: true, strict: true }) || 'image';
// const stamp = Date.now();
// return `${slug}-${stamp}${ext}`;
// }


