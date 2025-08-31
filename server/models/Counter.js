// server/models/Counter.js
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  { _id: { type: String }, seq: { type: Number, default: -1 } }, // seq holds "last used"
  { versionKey: false }
);

export const Counter =
  mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Ensure the counter matches the current max productId in DB.
 * Sets counters.productId.seq = max(productId) or -1 when empty.
 */
export async function syncCounterWithMax(ProductModel) {
  const maxDoc = await ProductModel
    .findOne({}, { productId: 1 })
    .sort({ productId: -1 })
    .lean();

  const maxId = typeof maxDoc?.productId === 'number' ? maxDoc.productId : -1;

  await Counter.updateOne(
    { _id: 'productId' },
    { $set: { seq: maxId } },
    { upsert: true }
  );

  return maxId;
}

/**
 * Atomically allocate next productId and insert the product in a transaction.
 * Returns the inserted document.
 */
export async function insertWithNextProductId(ProductModel, productDoc) {
  const session = await mongoose.startSession();
  let created;

  try {
    await session.withTransaction(async () => {
      // Make sure the counter doc exists and is aligned
      const c = await Counter.findById('productId').session(session);
      if (!c) {
        await Counter.updateOne(
          { _id: 'productId' },
          { $setOnInsert: { seq: -1 } },
          { upsert: true, session }
        );
      }

      // Reserve next id
      const { seq } = await Counter.findOneAndUpdate(
        { _id: 'productId' },
        { $inc: { seq: 1 } },
        { new: true, session }
      );

      const toInsert = { ...productDoc, productId: seq };
      const docs = await ProductModel.create([toInsert], { session });
      created = docs[0];
    });
  } finally {
    await session.endSession();
  }

  return created;
}
