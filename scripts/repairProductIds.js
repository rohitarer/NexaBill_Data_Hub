// scripts/repairProductIds.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Product from '../server/models/Product.js';
import { Counter, syncCounterWithMax } from '../server/models/Counter.js';
import '../server/config/db.js';

(async function run() {
  try {
    // Load all products oldest → newest (or change to sort by name, etc.)
    const items = await Product.find({}).sort({ createdAt: 1, _id: 1 }).lean();

    if (items.length === 0) {
      await Counter.updateOne({ _id: 'productId' }, { $set: { seq: -1 } }, { upsert: true });
      console.log('No products. Counter set to -1. Done.');
      process.exit(0);
    }

    // Renumber to 0..N-1
    let i = 0;
    for (const it of items) {
      if (it.productId !== i) {
        await Product.updateOne({ _id: it._id }, { $set: { productId: i } });
      }
      i++;
    }

    // Set counter to last used
    await Counter.updateOne({ _id: 'productId' }, { $set: { seq: items.length - 1 } }, { upsert: true });

    // Sanity: print new max
    const maxNow = await syncCounterWithMax(Product);
    console.log(`Reassigned ${items.length} docs. Counter now seq=${maxNow}.`);
  } catch (e) {
    console.error('Repair failed:', e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
