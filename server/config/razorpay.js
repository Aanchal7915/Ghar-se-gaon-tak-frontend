// src/config/razorpay.js
const Razorpay = require('razorpay');
require('dotenv').config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID?.trim(),
  key_secret: process.env.RAZORPAY_KEY_SECRET?.trim(),
});

module.exports = razorpayInstance;