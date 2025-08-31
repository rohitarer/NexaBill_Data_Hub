// server/models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // Auto-incremented (0,1,2,...) via Counter helper in controller
    productId: { type: Number, unique: true, index: true, required: true },

    name:   { type: String, required: true, trim: true },
    brand:  { type: String, default: '', trim: true },
    mrp:    { type: Number, default: 0 },
    weight: { type: String, default: '', trim: true },
    flavor: { type: String, default: '', trim: true },
    gst:    { type: Number, default: 0 },

    // e.g. "server/uploads/your-file.jpg" (served by /server/uploads/*)
    image_path: { type: String, required: true, trim: true }
  },
  {
    timestamps: true,     // adds createdAt / updatedAt
    versionKey: false
  }
);

// Export both named and default so imports work either way
export const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;

// // server/models/Product.js
// import mongoose from 'mongoose';

// const ProductSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     brand: { type: String, required: true, trim: true },
//     mrp: { type: Number, required: true },
//     weight: { type: String, required: true },
//     flavor: { type: String },
//     gst: { type: Number, default: 0 },
//     image_path: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// export default mongoose.model('Product', ProductSchema);
