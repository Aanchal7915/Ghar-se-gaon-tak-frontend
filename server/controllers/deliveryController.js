// src/controllers/deliveryController.js
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const otpService = require('../services/otpService');
const moment = require('moment');


exports.assignOrderToDelivery = async (req, res) => {
  const { orderId, deliveryPersonId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if delivery exists
    let delivery = await Delivery.findOne({ order: orderId });

    if (delivery) {
      if (delivery.deliveryPerson.toString() === deliveryPersonId) {
        // ✅ Same partner → do nothing, just return
        return res.status(200).json({ message: 'Order already assigned to this delivery person', delivery });
      }

      // ✅ Different partner → remove old delivery record
      await Delivery.deleteOne({ _id: delivery._id });
    }

    // Assign fresh delivery
    order.assignedTo = deliveryPersonId;
    order.status = 'out for delivery';
    await order.save();

    const newDelivery = new Delivery({
      order: orderId,
      deliveryPerson: deliveryPersonId,
      status: 'pending'
    });
    await newDelivery.save();

    const populatedDelivery = await newDelivery.populate([
      { path: 'order', populate: { path: 'user', select: 'name email phone' } },
      { path: 'deliveryPerson', select: 'name email' }
    ]);

    res.status(200).json({
      message: 'Order assigned successfully',
      delivery: populatedDelivery
    });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};




// @desc    DeliDvery person updates their live location
// @route   POST /api/delivery/location
exports.updateLiveLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  const deliveryPersonId = req.user._id;
  try {
    const delivery = await Delivery.findOneAndUpdate(
      { deliveryPerson: deliveryPersonId, status: { $ne: 'delivered' } },
      { 'liveLocation.latitude': latitude, 'liveLocation.longitude': longitude },
      { new: true }
    );
    if (!delivery) {
      return res.status(404).json({ message: 'No active delivery found' });
    }
    res.status(200).json({ message: 'Location updated', location: delivery.liveLocation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  const { orderId, status, otp } = req.body;

  try {
    const delivery = await Delivery.findOne({ order: orderId, deliveryPerson: req.user._id });
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // (Optional) ✅ Verify OTP if required
    if ((status === 'delivered' || status === 'cancelled') && otp) {
      if (delivery.otp !== otp || delivery.otpExpiry < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
    }

    // ✅ Update Delivery status
    delivery.status = status;

    if (status === 'delivered') {
      const deliveredDate = new Date();
      delivery.deliveredAt = deliveredDate;

      await Order.findByIdAndUpdate(orderId, {
        status: 'delivered',
        isDelivered: true,
        isCancelled: false,
        deliveredAt: deliveredDate
      });
    } else if (status === 'cancelled') {
      await Order.findByIdAndUpdate(orderId, {
        status: 'cancelled',
        isCancelled: true,
        isDelivered: false
      });
    } else {
      await Order.findByIdAndUpdate(orderId, { status });
    }

    await delivery.save();

    res.json({ message: 'Delivery status updated', delivery });
  } catch (error) {
    console.error('Update delivery status error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};



// @desc    Send OTP to customer for delivery status change
// @route   POST /api/delivery/send-otp
// @access  Private/Delivery
exports.sendDeliveryOtp = async (req, res) => {
  const { orderId } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  try {
    const delivery = await Delivery.findOne({ order: orderId }).populate('deliveryPerson', 'email');
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery record not found.' });
    }

    const order = await Order.findById(orderId).populate('user', 'email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    delivery.otp = otp;
    delivery.otpExpiry = otpExpiry;
    await delivery.save();

    await otpService.sendOTP(order.user.email, otp);

    res.status(200).json({ message: 'OTP sent to customer\'s email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
};



exports.adminUpdateDeliveryStatus = async (req, res) => {
  const { status } = req.body;
  const { id: orderId } = req.params;

  try {
    const delivery = await Delivery.findOne({ order: orderId });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    delivery.status = status;

    // ✅ When delivered, update both Delivery and Order with deliveredAt timestamp
    if (status === 'delivered') {
      const deliveredDate = new Date();
      delivery.deliveredAt = deliveredDate;

      await Order.findByIdAndUpdate(orderId, {
        status: 'delivered',
        isDelivered: true,
        isCancelled: false,
        deliveredAt: deliveredDate
      });
    } else {
      // ✅ Keep Order status in sync
      await Order.findByIdAndUpdate(orderId, {
        status,
        isCancelled: status === 'cancelled'
      });
    }

    await delivery.save();
    res.json(delivery);
  } catch (error) {
    console.error('Admin update delivery status error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getCancelledOrders = async (req, res) => {
  try {
    const cancelledDeliveries = await Delivery.find({
      deliveryPerson: req.user._id,
      status: 'cancelled'
    }).populate({
      path: 'order',
      populate: {
        path: 'orderItems.product',
        select: 'name images productId'
      }
    }).populate('order.user', 'name email phone');

    res.status(200).json(cancelledDeliveries);
  } catch (error) {
    console.error('Error fetching cancelled deliveries:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};



// Get assigned deliveries for a delivery person
exports.getAssignedDeliveries = async (req, res) => {
  try {
    let deliveries = await Delivery.find({
      deliveryPerson: req.user._id,
      status: { $in: ['pending', 'out for delivery'] }
    }).populate({
      path: 'order',
      populate: [
        { path: 'user', select: 'name email phone' },
        { path: 'orderItems.product', select: 'productId name images' }
      ]
    });

    // Deduplicate
    const seen = new Set();
    deliveries = deliveries.filter(del => {
      if (!del.order) return false;
      if (seen.has(del.order._id.toString())) return false;
      seen.add(del.order._id.toString());
      return true;
    });

    res.json(deliveries);
  } catch (error) {
    console.error('Get assigned deliveries error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get delivered orders for a delivery person
exports.getDeliveredOrders = async (req, res) => {
  const { month, year } = req.query;
  let filter = {
    deliveryPerson: req.user._id,
    status: 'delivered',
  };

  if (month && year) {
    const startOfMonth = moment().month(month - 1).year(year).startOf('month').toDate();
    const endOfMonth = moment().month(month - 1).year(year).endOf('month').toDate();
    filter.deliveredAt = { $gte: startOfMonth, $lte: endOfMonth };
  }

  try {
    const deliveredOrders = await Delivery.find(filter)
      .populate({
        path: 'order',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'orderItems.product', select: 'productId name images' }
        ]
      })
      .sort({ deliveredAt: -1 });

    res.json(deliveredOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Pending deliveries for admin dashboard
exports.getPendingDeliveries = async (req, res) => {
  try {
    const pendingDeliveries = await Delivery.find({ status: 'pending' })
      .populate({
        path: 'order',
        populate: { path: 'orderItems.product', select: 'productId name images' }
      })
      .populate('deliveryPerson', 'email');

    res.json(pendingDeliveries);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
