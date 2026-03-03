
// module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: Number, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  brand: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

  // NEW FIELDS
  gender: {
    type: String,
    enum: ['standard', 'organic', 'premium', 'budget'],
    required: true
  },
  subCategory: { type: String }, // optional (e.g. "sneakers", "boots")

  variants: [{
    size: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number }, // Standard/MRP price to show as strikethrough
    discount: { type: Number },
    countInStock: { type: Number, required: true, default: 0 },
  }],
  pincodePricing: [{
    pincode: { type: String },
    location: { type: String },
    price: { type: Number },
    originalPrice: { type: Number },
    discount: { type: Number },
    inventory: { type: Number, default: 0 }
  }],
  videoUrl: { type: String }, // NEW FIELD for video (YouTube/Upload)
  farmerName: { type: String },
  farmerPhone: { type: String },
  farmerLocation: { type: String },
  farmerEmail: { type: String },
  isComingSoon: { type: Boolean, default: false }, // NEW FIELD for upcoming section
  isFeatured: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-increment productId
productSchema.pre('save', async function (next) {
  if (!this.productId) {
    const lastProduct = await mongoose.model('Product').findOne().sort({ productId: -1 });
    this.productId = lastProduct ? lastProduct.productId + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

