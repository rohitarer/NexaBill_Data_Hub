// server/controllers/uploadController.js
import path from 'path';
import { processImagePipeline } from '../middleware/imageProcessor.js';
import { safeFilename } from '../utils/fileUtils.js';
import Product from '../models/Product.js';

export async function handleUpload(req, res) {
  try {
    const { name, brand, mrp, weight, flavor = null, gst } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Image is required (field name: image)' });

    const uploadsRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), 'server', 'uploads');
    const finalName = safeFilename(req.file.originalname).replace(/\.[^.]+$/, '.jpg');
    const finalPath = path.join(uploadsRoot, finalName);

    await processImagePipeline(req.file.path, finalPath);

    const doc = await Product.create({
      name,
      brand,
      mrp: Number(mrp),
      weight,
      flavor,
      gst: Number(gst || 0),
      image_path: `uploads/${finalName}`
    });

    return res.json(doc);
  } catch (err) {
    console.error('❌ Upload failed:', err.stack || err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}



// import path from 'path';
// import { processImage } from '../middleware/imageProcessor.js';
// import { safeFilename } from '../utils/fileUtils.js';
// import Product from '../models/Product.js';

// export async function handleUpload(req, res) {
//   try {
//     const required = ['name','brand','mrp','weight','gst'];
//     for (const k of required) {
//       if (!req.body[k] || (k === 'mrp' && isNaN(Number(req.body[k])))) {
//         return res.status(400).json({ error: `Missing/invalid field: ${k}` });
//       }
//     }
//     if (!req.file) return res.status(400).json({ error: 'Image is required (field name: image)' });

//     const uploadsRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), 'server', 'uploads');
//     const finalName = safeFilename(req.file.originalname).replace(/\.[^.]+$/, '.jpg');
//     const finalPath = path.join(uploadsRoot, finalName);

//     await processImage(req.file.path, finalPath);

//     const doc = await Product.create({
//       name: req.body.name,
//       brand: req.body.brand,
//       mrp: Number(req.body.mrp),
//       weight: req.body.weight,
//       flavor: req.body.flavor || null,
//       gst: Number(req.body.gst || 0),
//       image_path: `uploads/${finalName}`
//     });

//     console.log('   ✅ saved product _id:', doc._id.toString());
//     return res.json(doc);
//   } catch (err) {
//     console.error('❌ Upload failed:', err.stack || err);
//     return res.status(500).json({ error: err.message || 'Upload failed' });
//   }
// }
