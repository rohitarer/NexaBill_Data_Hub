// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './config/db.js';

import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// NEW: bring in Product and counter sync
import Product from './models/Product.js';
import { syncCounterWithMax } from './models/Counter.js';

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS (allow file:// too)
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// log uploads
app.use('/api/upload', (req, res, next) => { console.log(`--> ${req.method} ${req.originalUrl}`); next(); });

// STATIC: expose server/uploads at BOTH /uploads/* and /server/uploads/*
const uploadsDir = process.env.UPLOAD_DIR
  ? (path.isAbsolute(process.env.UPLOAD_DIR)
      ? process.env.UPLOAD_DIR
      : path.join(process.cwd(), process.env.UPLOAD_DIR)) // e.g., "server/uploads"
  : path.join(__dirname, 'uploads'); // fallback to server/uploads

app.use('/uploads',        express.static(uploadsDir));
app.use('/server/uploads', express.static(uploadsDir)); // keep legacy paths working

// routes
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

// ---- Sync counter with current max BEFORE listening (prevents gaps on restarts) ----
await syncCounterWithMax(Product);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🖼️  Serving uploads from: ${uploadsDir}`);
});



// // server/index.js
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import './config/db.js';
// import productRoutes from './routes/productRoutes.js';
// import uploadRoutes from './routes/uploadRoutes.js';

// dotenv.config();
// const app = express();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Allow file:// origins (when you open index.html directly)
// app.use(cors({
//   origin: (origin, cb) => cb(null, true),
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // quick health
// app.get('/api/ping', (req, res) => res.json({ ok: true }));

// // log only upload requests in detail
// app.use('/api/upload', (req, res, next) => {
//   console.log(`--> ${req.method} ${req.originalUrl}`);
//   next();
// });

// // static images
// const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
// app.use('/uploads', express.static(uploadsDir));

// // routes
// app.use('/api/products', productRoutes);
// app.use('/api/upload', uploadRoutes);

// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
