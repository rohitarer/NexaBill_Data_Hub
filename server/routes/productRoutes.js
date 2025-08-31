import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { Product } from '../models/Product.js';
import { processImagePipeline } from '../middleware/imageProcessor.js';
import { getSafeFileName } from '../utils/fileUtils.js';

const router = Router();

/** Multer temp storage (same as upload route) */
const upload = multer({
  dest: path.join(process.cwd(), 'server', 'uploads', 'tmp'),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// GET all products (sorted by productId asc)
router.get('/', async (req, res) => {
  const items = await Product.find({}).sort({ productId: 1 }).lean();
  res.json(items);
});

// UPDATE product by productId (fields + optional new image)
router.put('/:productId', upload.single('image'), async (req, res) => {
  const id = Number(req.params.productId);
  if (Number.isNaN(id)) return res.status(400).send('Invalid productId');

  const body = req.body || {};

  // build update doc
  const update = {};
  if (typeof body.name !== 'undefined') update.name = body.name;
  if (typeof body.brand !== 'undefined') update.brand = body.brand;
  if (typeof body.mrp !== 'undefined' && body.mrp !== '') update.mrp = Number(body.mrp);
  if (typeof body.weight !== 'undefined') update.weight = body.weight;
  if (typeof body.flavor !== 'undefined') update.flavor = body.flavor;
  if (typeof body.gst !== 'undefined' && body.gst !== '') update.gst = Number(body.gst);

  // if image provided, process and set image_path
  if (req.file) {
    const existing = await Product.findOne({ productId: id }).lean();
    const safe = getSafeFileName((body.name || existing?.name || 'product'));
    const finalRel = `server/uploads/${safe}-${Date.now()}.jpg`;
    await processImagePipeline(req.file.path, finalRel);
    update.image_path = finalRel;

    // cleanup tmp uploaded file if left
    try { await fs.unlink(req.file.path); } catch {}
  }

  const doc = await Product.findOneAndUpdate({ productId: id }, update, { new: true });
  if (!doc) return res.status(404).send('Not found');
  res.json({ ok: true, product: doc });
});

// DELETE product by productId
router.delete('/:productId', async (req, res) => {
  const id = Number(req.params.productId);
  if (Number.isNaN(id)) return res.status(400).send('Invalid productId');

  const doc = await Product.findOneAndDelete({ productId: id });
  if (!doc) return res.status(404).send('Not found');

  // (optional) try to remove image file from disk
  if (doc.image_path) {
    try { await fs.unlink(path.join(process.cwd(), doc.image_path)); } catch {}
  }

  res.json({ ok: true });
});

export default router;



// // server/routes/productRoutes.js
// import express from 'express';
// import { getAllProducts } from '../controllers/productController.js';

// const router = express.Router();

// // GET /api/products
// router.get('/', getAllProducts);

// export default router;
