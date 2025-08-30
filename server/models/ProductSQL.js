import { pool } from '../config/db.js';


export async function insertProduct(product) {
const sql = `INSERT INTO products
(name, brand, mrp, weight, flavor, gst, image_path)
VALUES (:name, :brand, :mrp, :weight, :flavor, :gst, :image_path)`;
const [result] = await pool.execute(sql, product);
return { id: result.insertId, ...product, created_at: new Date() };
}


export async function fetchAllProducts() {
const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
return rows;
}