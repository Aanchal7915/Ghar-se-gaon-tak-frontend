
// src/controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const moment = require('moment');
const mongoose = require('mongoose');
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  // CORRECTED: Accept customerInfo from the request body
  const { orderItems, shippingAddress, totalPrice, customerLocation, customerInfo } = req.body;
  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderNumber = `ORD-${Date.now()}`;
    const validatedOrderItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Product not found for item: ${item.name}`);
      }

      const variant = product.variants.find(v => v.size === item.size);
      if (!variant) {
        throw new Error(`Variant not found for product: ${item.name}`);
      }

      if (variant.countInStock < item.qty) {
        throw new Error(`Insufficient stock for ${item.name} (Size: ${item.size}). Available: ${variant.countInStock}`);
      }

      // Decrement stock
      variant.countInStock -= item.qty;
      await product.save({ session });

      validatedOrderItems.push({
        name: item.name,
        qty: item.qty,
        price: item.price,
        product: item.product,
        size: item.size
      });
    }

    const order = new Order({
      orderNumber,
      user: req.user._id,
      orderItems: validatedOrderItems,
      shippingAddress,
      totalPrice,
      customerLocation,
      // CORRECTED: Save customerInfo from the request body
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone
      }
    });

    const createdOrder = await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(createdOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Order creation failed:', error.message);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
// exports.createOrder = async (req, res) => {
//     const { orderItems, shippingAddress, totalPrice, customerLocation } = req.body;
//     if (!orderItems || orderItems.length === 0) {
//         return res.status(400).json({ message: 'No order items' });
//     }

//     const session = await mongoose.startSession(); // CORRECTED: Initialize the session
//     session.startTransaction();

//     try {
//         const orderNumber = `ORD-${Date.now()}`;
//         const validatedOrderItems = [];

//         for (const item of orderItems) {
//             const product = await Product.findById(item.product).session(session);
//             if (!product) {
//                 throw new Error(`Product not found for item: ${item.name}`);
//             }

//             const variant = product.variants.find(v => v.size === item.size);
//             if (!variant) {
//                 throw new Error(`Variant not found for product: ${item.name}`);
//             }

//             if (variant.countInStock < item.qty) {
//                 throw new Error(`Insufficient stock for ${item.name} (Size: ${item.size}). Available: ${variant.countInStock}`);
//             }

//             // Decrement stock
//             variant.countInStock -= item.qty;
//             await product.save({ session });

//             validatedOrderItems.push({
//                 name: item.name,
//                 qty: item.qty,
//                 price: item.price,
//                 product: item.product,
//                 size: item.size
//             });
//         }

//         const order = new Order({
//             orderNumber,
//             user: req.user._id,
//             orderItems: validatedOrderItems,
//             shippingAddress,
//             totalPrice,
//             customerLocation,
//         });

//         const createdOrder = await order.save({ session });

//         await session.commitTransaction();
//         session.endSession();

//         res.status(201).json(createdOrder);
//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error('Order creation failed:', error.message);
//         res.status(500).json({ message: error.message || 'Server Error' });
//     }
// };


// exports.getCompletedOrders = async (req, res) => {
//   const { month, year } = req.query;
//   let filter = { isDelivered: true };

//   if (month && year) {
//     // Use a more robust date parsing method to handle time zones
//     const startOfMonth = moment().year(year).month(month - 1).startOf('month').toDate();
//     const endOfMonth = moment().year(year).month(month - 1).endOf('month').toDate();

//     console.log('Backend Filter Dates:');
//     console.log('Start of Month (Local Time):', startOfMonth);
//     console.log('End of Month (Local Time):', endOfMonth);

//     filter.deliveredAt = { $gte: startOfMonth, $lte: endOfMonth };
//   }

//   try {
//     const completedOrders = await Order.find(filter)
//       .populate('user', 'name email phone')
//       .populate('assignedTo', 'name email');

//     console.log('Raw data received from DB (pre-filter):', completedOrders.map(order => ({
//       orderId: order.orderNumber,
//       deliveredAt: order.deliveredAt
//     })));

//     res.json(completedOrders);
//   } catch (error) {
//     console.error('Backend Error:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };



exports.createRazorpayOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    const options = {
      amount: order.totalPrice * 100,
      currency: "INR",
      receipt: order._id.toString()
    };
    try {
      const razorpayOrder = await razorpayInstance.orders.create(options);

      // Crucially, send the key_id back to the frontend
      const responseData = {
        key_id: process.env.RAZORPAY_KEY_ID, // Add this line
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        id: razorpayOrder.id,
      };

      res.status(201).json(responseData);
    } catch (error) {
      res.status(500).json({ message: 'Razorpay order creation failed' });
    }
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/:id/verify-payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');

  if (digest === razorpay_signature) {
    // Payment is successful, update the order
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'success',
        update_time: Date.now()
      };
      await order.save();
      res.json({ message: 'Payment successful', order });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } else {
    res.status(400).json({ message: 'Invalid signature' });
  }
};

// @desc    Get all orders for the logged-in user
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('orderItems.product', 'name images').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.revertOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    order.status = status;
    order.isDelivered = false;
    order.isCancelled = false;
    order.deliveredAt = null; // ✅ Reset deliveredAt
    if (status === 'pending') {
      order.assignedTo = null;
    }
    await order.save();
    res.status(200).json({ message: 'Order status reverted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};





// Unassigned Orders
exports.getUnassignedOrders = async (req, res) => {
  try {
    const unassignedOrders = await Order.find({
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ],
      isDelivered: false,
      isCancelled: false
    })
      .populate('user', 'email name')
      .populate({
        path: 'orderItems.product',
        select: 'productId name images'
      });

    res.json(unassignedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Assigned Orders
exports.getAssignedOrders = async (req, res) => {
  try {
    const assignedOrders = await Order.find({
      assignedTo: { $ne: null },
      isDelivered: false,
      isCancelled: false
    })
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'productId name images'
      });

    res.json(assignedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};




// Completed Orders
exports.getCompletedOrders = async (req, res) => {
  const { month, year } = req.query;
  let filter = { isDelivered: true };

  if (month && year) {
    const startOfMonth = moment().year(year).month(month - 1).startOf('month').toDate();
    const endOfMonth = moment().year(year).month(month - 1).endOf('month').toDate();
    filter.deliveredAt = { $gte: startOfMonth, $lte: endOfMonth };
  }

  try {
    const completedOrders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'productId name images'
      });

    res.json(completedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Cancelled Orders
exports.getCancelledOrders = async (req, res) => {
  const { month, year } = req.query;
  let filter = { isCancelled: true };

  if (month && year) {
    const startOfMonth = moment().month(month - 1).year(year).startOf('month').toDate();
    const endOfMonth = moment().month(month - 1).year(year).endOf('month').toDate();
    filter.updatedAt = { $gte: startOfMonth, $lte: endOfMonth };
  }

  try {
    const cancelledOrders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'productId name images'
      });

    res.json(cancelledOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

