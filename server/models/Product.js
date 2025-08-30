// server/models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    mrp: { type: Number, required: true },
    weight: { type: String, required: true },
    flavor: { type: String },
    gst: { type: Number, default: 0 },
    image_path: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Product', ProductSchema);
