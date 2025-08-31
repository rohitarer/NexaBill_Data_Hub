// server/controllers/uploadController.js
import path from "path";
import fs from "fs/promises";
import Product from "../models/Product.js";
import { processImagePipeline } from "../middleware/imageProcessor.js";
import { getSafeFileName } from "../utils/fileUtils.js";
import { insertWithNextProductId } from "../models/Counter.js"; // ← transactional insert

export async function handleUpload(req, res) {
	try {
		const {
			name,
			brand = "",
			mrp = "",
			weight = "",
			flavor = "",
			gst = "",
		} = req.body || {};

		if (!name || !req.file) {
			return res.status(400).send("name and image are required");
		}

		// Build final output path for processed image
		const safe = getSafeFileName(name);
		const finalRel = `server/uploads/${safe}-${Date.now()}.jpg`;

		// Process the image (bg remove, gradient, fit, jpeg)
		await processImagePipeline(req.file.path, finalRel);

		// Clean up Multer temp file
		try {
			await fs.unlink(req.file.path);
		} catch {}

		// Prepare document (WITHOUT productId; it will be added inside the transaction)
		const doc = {
			name: name.trim(),
			brand: brand?.trim?.() || "",
			mrp: mrp !== "" ? Number(mrp) : 0,
			weight: weight?.trim?.() || "",
			flavor: flavor?.trim?.() || "",
			gst: gst !== "" ? Number(gst) : 0,
			image_path: finalRel,
		};

		// Atomically assign productId and insert
		const saved = await insertWithNextProductId(Product, doc);
		return res.json({ ok: true, product: saved });
	} catch (err) {
		console.error("❌ Upload failed:", err);
		return res.status(500).send(String(err?.message || err));
	}
}

// // server/controllers/uploadController.js
// import path from 'path';
// import { processImagePipeline } from '../middleware/imageProcessor.js';
// import { safeFilename } from '../utils/fileUtils.js';
// import Product from '../models/Product.js';

// export async function handleUpload(req, res) {
//   try {
//     const { name, brand, mrp, weight, flavor = null, gst } = req.body;
//     if (!req.file) return res.status(400).json({ error: 'Image is required (field name: image)' });

//     const uploadsRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), 'server', 'uploads');
//     const finalName = safeFilename(req.file.originalname).replace(/\.[^.]+$/, '.jpg');
//     const finalPath = path.join(uploadsRoot, finalName);

//     await processImagePipeline(req.file.path, finalPath);

//     const doc = await Product.create({
//       name,
//       brand,
//       mrp: Number(mrp),
//       weight,
//       flavor,
//       gst: Number(gst || 0),
//       image_path: `uploads/${finalName}`
//     });

//     return res.json(doc);
//   } catch (err) {
//     console.error('❌ Upload failed:', err.stack || err);
//     return res.status(500).json({ error: err.message || 'Upload failed' });
//   }
// }

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
