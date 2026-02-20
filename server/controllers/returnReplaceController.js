

const ReturnReplace = require('../models/ReturnReplace');
const Order = require('../models/Order');
const Product = require('../models/Product');
const moment = require('moment');

// User requests a return or replacement
const requestReturnReplace = async (req, res) => {
    const { orderId, type, reason, replacedProductInfo, originalItem } = req.body;
    const userId = req.user._id;

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to perform this action' });
        }

        const existingRequest = await ReturnReplace.findOne({
            order: orderId,
            'originalItem.product': originalItem.product,
            'originalItem.size': originalItem.size,
            status: { $in: ['pending', 'out for pickup'] }
        });
        if (existingRequest) {
            return res.status(400).json({ message: 'A return/replace request is already in progress for this particular item.' });
        }

        // if (type === 'replace' && order.isReplaced) {
        //     return res.status(400).json({ message: 'This order has already been replaced. Only return is allowed now.' });
        // }

        // if (type === 'return' && order.isReplaced) {
        //     return res.status(400).json({ message: 'Cannot return while a replacement is in progress.' });
        // }

        const returnReplaceRequest = new ReturnReplace({
            order: orderId,
            user: userId,
            type,
            reason,
            originalItem,
            replacedItem: type === 'replace' ? replacedProductInfo : undefined
        });

        await returnReplaceRequest.save();

        if (type === 'replace') order.isReplaced = true;
        if (type === 'return') order.isReturned = true;
        await order.save();

        res.status(201).json({ message: 'Request submitted successfully!', request: returnReplaceRequest });
    } catch (error) {
        console.error('Error requesting return/replace:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Cancel a request
const cancelReturnReplaceRequest = async (req, res) => {
    const { requestId } = req.body;
    const userId = req.user._id;

    try {
        const request = await ReturnReplace.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found.' });

        if (request.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this request.' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot cancel. Request already out for pickup or processed.' });
        }

        await Order.findByIdAndUpdate(request.order, {
            isReplaced: false,
            isReturned: false,
        });

        await ReturnReplace.deleteOne({ _id: requestId });

        res.status(200).json({ message: 'Request cancelled successfully.' });
    } catch (error) {
        console.error('Error canceling request:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: get pending
const getPendingRequests = async (req, res) => {
    try {
        const pending = await ReturnReplace.find({ status: { $in: ['pending', 'approved'] } })
            .populate({
                path: 'order',
                select: 'orderNumber totalPrice status createdAt isReturned isReplaced orderItems shippingAddress',
                populate: {
                    path: 'orderItems.product',
                    select: 'name images'
                }
            })
            .populate('originalItem.product')

        res.json(pending);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: assign pickup
const assignPickup = async (req, res) => {
    const { requestId, deliveryPersonId } = req.body;
    try {
        const request = await ReturnReplace.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.pickupPerson = deliveryPersonId;
        request.status = 'out for pickup';
        await request.save();

        res.json({ message: 'Pickup assigned successfully', request });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delivery updates status
const updatePickupStatus = async (req, res) => {
    const { requestId, status } = req.body;
    const deliveryPersonId = req.user._id;

    try {
        const request = await ReturnReplace.findById(requestId);
        if (!request || request.pickupPerson.toString() !== deliveryPersonId.toString()) {
            return res.status(403).json({ message: 'Not authorized for this pickup' });
        }

        request.status = status;
        if (status === 'received' || status === 'completed' || status === 'exchanged') {
            request.pickupDeliveredAt = new Date();

            if ((request.type === 'replace' || request.type === 'return') && status !== 'cancelled') {
                const originalOrder = await Order.findById(request.order);
                if (originalOrder) {
                    const isReplace = request.type === 'replace';
                    const itemData = isReplace ? request.replacedItem : request.originalItem;

                    const newOrder = new Order({
                        orderNumber: `${isReplace ? 'REP' : 'RET'}-${Date.now()}`,
                        user: request.user,
                        orderItems: [{
                            name: itemData.name,
                            qty: itemData.qty,
                            price: 0,
                            product: itemData.product,
                            size: itemData.size
                        }],
                        shippingAddress: originalOrder.shippingAddress,
                        customerInfo: originalOrder.customerInfo,
                        paymentMethod: isReplace ? 'Replacement' : 'Return Pickup',
                        totalPrice: 0,
                        isPaid: true,
                        isReplaced: false,
                        isReturned: false,
                        paidAt: Date.now(),
                        customerLocation: originalOrder.customerLocation
                    });
                    await newOrder.save();
                }
            }
        }
        await request.save();

        res.json({ message: 'Pickup status updated', request });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: completed requests
const getAdminCompletedRequests = async (req, res) => {
    try {
        const completed = await ReturnReplace.find({ status: { $in: ['received', 'completed', 'exchanged'] } })
            .populate('user', 'name email phone address')
            .populate({
                path: 'order',
                select: 'orderNumber totalPrice shippingAddress orderItems',
                populate: {
                    path: 'orderItems.product',
                    select: 'name images'
                }
            })
            .populate('originalItem.product')
            .sort({ updatedAt: -1 });

        res.json(completed);
    } catch (error) {
        console.error('Error fetching completed requests:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: cancelled requests
const getAdminCancelledRequests = async (req, res) => {
    try {
        const cancelled = await ReturnReplace.find({ status: { $in: ['cancelled', 'rejected'] } })
            .populate('user', 'name email phone address')
            .populate({
                path: 'order',
                select: 'orderNumber totalPrice shippingAddress orderItems',
                populate: {
                    path: 'orderItems.product',
                    select: 'name images'
                }
            })
            .populate('originalItem.product')
            .sort({ updatedAt: -1 });

        res.json(cancelled);
    } catch (error) {
        console.error('Error fetching cancelled requests:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ... (Rest of file same until getAdminAssignedPickups function)

// Delivery person: get pickups assigned to me
const getMyPickups = async (req, res) => {
    try {
        const pickups = await ReturnReplace.find({ pickupPerson: req.user._id })
            .populate('order', 'orderNumber totalPrice status')
            .sort({ createdAt: -1 });

        res.json(pickups);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// User: get all my requests (pending/completed)
const getMyPendingRequests = async (req, res) => {
    try {
        const requests = await ReturnReplace.find({ user: req.user._id })
            .populate({
                path: 'order',
                select: 'orderNumber totalPrice status createdAt isDelivered isReturned isReplaced orderItems',
                populate: {
                    path: 'orderItems.product',
                    select: 'name images variants.size variants.countInStock'
                }
            })
            .populate('originalItem.product')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error("Error fetching user's return/replace requests:", error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delivery: completed pickups
const getCompletedPickups = async (req, res) => {
    try {
        const completed = await ReturnReplace.find({
            pickupPerson: req.user._id,
            status: 'received',
        })
            .populate('order', 'orderNumber')
            .sort({ pickupDeliveredAt: -1 });

        res.json(completed);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: rejected requests
const getAdminRejectedRequests = async (req, res) => {
    try {
        const rejected = await ReturnReplace.find({ status: 'rejected' })
            .populate('user', 'name email phone address')
            .populate({
                path: 'order',
                select: 'orderNumber totalPrice shippingAddress orderItems',
                populate: {
                    path: 'orderItems.product',
                    select: 'name images'
                }
            })
            .sort({ updatedAt: -1 });

        res.json(rejected);
    } catch (error) {
        console.error('Error fetching rejected requests:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: approve request
const approveReturnReplaceRequest = async (req, res) => {
    const { requestId } = req.body;
    try {
        const request = await ReturnReplace.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = 'approved';
        await request.save();

        res.json({ message: 'Request approved successfully!', request });
    } catch (error) {
        console.error('Error approving request:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: reject request
const rejectReturnReplaceRequest = async (req, res) => {
    const { requestId, reason } = req.body;
    try {
        const request = await ReturnReplace.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = 'rejected';
        request.rejectionReason = reason;
        await request.save();

        await Order.findByIdAndUpdate(request.order, {
            $set: { isReplaced: false, isReturned: false },
        });

        res.json({ message: 'Request rejected successfully!', request });
    } catch (error) {
        console.error('Error rejecting request:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// NEW: Admin: complete a return/replace request after item is received
const completeReturnReplaceRequest = async (req, res) => {
    const { requestId } = req.body;
    try {
        const request = await ReturnReplace.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = 'completed';
        await request.save();

        res.json({ message: 'Request marked as completed successfully!', request });
    } catch (error) {
        console.error('Error completing request:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: Manually update pickup status
const updatePickupStatusByAdmin = async (req, res) => {
    const { requestId, status } = req.body;
    try {
        const request = await ReturnReplace.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;
        if (status === 'received' || status === 'completed' || status === 'exchanged') {
            request.pickupDeliveredAt = new Date();

            if ((request.type === 'replace' || request.type === 'return') && status !== 'cancelled') {
                const originalOrder = await Order.findById(request.order);
                if (originalOrder) {
                    const isReplace = request.type === 'replace';
                    const itemData = isReplace ? request.replacedItem : request.originalItem;

                    const newOrder = new Order({
                        orderNumber: `${isReplace ? 'REP' : 'RET'}-${Date.now()}`,
                        user: request.user,
                        orderItems: [{
                            name: itemData.name,
                            qty: itemData.qty,
                            price: 0,
                            product: itemData.product,
                            size: itemData.size
                        }],
                        shippingAddress: originalOrder.shippingAddress,
                        customerInfo: originalOrder.customerInfo,
                        paymentMethod: isReplace ? 'Replacement' : 'Return Pickup',
                        totalPrice: 0,
                        isPaid: true,
                        isReplaced: false,
                        isReturned: false,
                        paidAt: Date.now(),
                        customerLocation: originalOrder.customerLocation
                    });
                    await newOrder.save();
                }
            }
        }
        await request.save();

        res.json({ message: 'Status updated successfully', request });
    } catch (error) {
        console.error('Error updating status by admin:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAdminAssignedPickups = async (req, res) => {
    try {
        const assignedPickups = await ReturnReplace.find({ status: { $in: ['out for pickup', 'out for delivery'] } })
            .populate('user', 'name email phone address')
            .populate({
                path: 'order',
                select: 'orderNumber shippingAddress',
                populate: {
                    path: 'orderItems.product',
                    select: 'name images'
                }
            })
            .populate('originalItem.product')
            .populate('pickupPerson', 'name email phone');
        res.json(assignedPickups);
    } catch (error) {
        console.error('Error fetching assigned pickups:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = {
    requestReturnReplace,
    cancelReturnReplaceRequest,
    getPendingRequests,
    assignPickup,
    updatePickupStatus,
    getMyPickups,
    getMyPendingRequests,
    getCompletedPickups,
    getAdminCompletedRequests,
    getAdminCancelledRequests,
    getAdminRejectedRequests,
    rejectReturnReplaceRequest,
    approveReturnReplaceRequest,
    completeReturnReplaceRequest,
    getAdminAssignedPickups,
    updatePickupStatusByAdmin
};


