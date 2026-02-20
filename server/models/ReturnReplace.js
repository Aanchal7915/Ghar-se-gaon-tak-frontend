const mongoose = require('mongoose');

const returnReplaceSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['return', 'replace'], required: true },
    reason: { type: String, required: true },
    rejectionReason: { type: String }, // Corrected the typo here
    status: {
        type: String,
        enum: ['pending', 'approved', 'out for pickup', 'out for delivery', 'received', 'completed', 'exchanged', 'rejected', 'cancelled'],
        default: 'pending'
    },
    customerInfo: {
        name: String,
        email: String,
        phone: String,
        address: String
    },
    // The original item being returned or replaced
    originalItem: {
        name: { type: String },
        qty: { type: Number },
        price: { type: Number },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        size: { type: String }
    },
    // The new item being sent in a replacement
    replacedItem: {
        name: { type: String },
        qty: { type: Number },
        price: { type: Number },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        size: { type: String }
    },
    // Track if a replacement has already been requested to enforce the one-time rule
    isReplaced: { type: Boolean, default: false },
    // A separate delivery person for pickup
    pickupPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pickupDeliveredAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ReturnReplace', returnReplaceSchema);