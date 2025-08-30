// server/controllers/productController.js
import Product from '../models/Product.js';

export async function getAllProducts(req, res) {
  try {
    const items = await Product.find({}).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('❌ Fetch products failed:', err.stack || err);
    res.status(500).json({ error: 'Database error fetching products' });
  }
}
