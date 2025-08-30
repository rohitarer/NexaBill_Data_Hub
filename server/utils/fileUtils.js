import slugify from 'slugify';
import path from 'path';


export function safeFilename(originalName) {
const ext = path.extname(originalName).toLowerCase() || '.jpg';
const base = path.basename(originalName, ext);
const slug = slugify(base, { lower: true, strict: true }) || 'image';
const stamp = Date.now();
return `${slug}-${stamp}${ext}`;
}


