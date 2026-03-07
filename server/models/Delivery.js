

const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'out for delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  otp: { type: String },
  otpExpiry: { type: Date },
  liveLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  deliveredAt: { type: Date }   // ✅ Add this field
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
