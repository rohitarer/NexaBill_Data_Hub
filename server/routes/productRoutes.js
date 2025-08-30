// server/routes/productRoutes.js
import express from 'express';
import { getAllProducts } from '../controllers/productController.js';

const router = express.Router();

// GET /api/products
router.get('/', getAllProducts);

export default router;
