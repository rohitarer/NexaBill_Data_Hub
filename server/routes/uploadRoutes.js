// server/routes/uploadRoutes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { handleUpload } from '../controllers/uploadController.js';

const router = Router();

const upload = multer({
  dest: path.join(process.cwd(), 'server', 'uploads', 'tmp'),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// Debug endpoint (kept if you found it useful)
router.post('/debug', (req, res) => {
  res.json({ body: req.body });
});

// Main upload
router.post('/', upload.single('image'), handleUpload);

export default router;



// import express from 'express';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs/promises';
// import { handleUpload } from '../controllers/uploadController.js';

// const router = express.Router();

// // Ensure tmp dir exists
// const tmpDir = path.join(process.cwd(), 'server', 'uploads', 'tmp');
// await fs.mkdir(tmpDir, { recursive: true });

// // Configure multer
// const upload = multer({
//   dest: tmpDir,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
// });

// // POST /api/upload
// router.post('/', upload.single('image'), handleUpload);

// // Optional: debug endpoint to inspect body only (no file)
// router.post('/debug', (req, res) => {
//     res.json({ body: req.body || {} });
//   });

// export default router;
