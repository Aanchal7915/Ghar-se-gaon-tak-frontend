const express = require('express');
const router = express.Router();
const returnReplaceController = require('../controllers/returnReplaceController');
const { protect, admin, deliveryPerson } = require('../middlewares/authMiddleware');

// User routes
router.post('/request', protect, returnReplaceController.requestReturnReplace);
router.post('/cancel-request', protect, returnReplaceController.cancelReturnReplaceRequest);
router.get('/my-requests', protect, returnReplaceController.getMyPendingRequests);

// Admin routes
router.get('/admin/pending', protect, admin, returnReplaceController.getPendingRequests);
router.post('/admin/assign-pickup', protect, admin, returnReplaceController.assignPickup);
router.get('/admin/completed', protect, admin, returnReplaceController.getAdminCompletedRequests);
router.get('/admin/cancelled', protect, admin, returnReplaceController.getAdminCancelledRequests);
router.get('/admin/rejected', protect, admin, returnReplaceController.getAdminRejectedRequests); // Added this route for clarity

// NEW: Admin route to mark a request as completed
router.post('/admin/complete-request', protect, admin, returnReplaceController.completeReturnReplaceRequest);


// Delivery person routes
router.post('/pickup-status', protect, deliveryPerson, returnReplaceController.updatePickupStatus);
router.get('/my-pickups', protect, deliveryPerson, returnReplaceController.getMyPickups);
router.get('/my-pickups/completed', protect, deliveryPerson, returnReplaceController.getCompletedPickups);


router.post('/admin/approve-request', protect, admin, returnReplaceController.approveReturnReplaceRequest);
router.post('/admin/reject-request', protect, admin, returnReplaceController.rejectReturnReplaceRequest);
router.get('/admin/assigned-pickups', protect, admin, returnReplaceController.getAdminAssignedPickups);
router.post('/admin/update-status', protect, admin, returnReplaceController.updatePickupStatusByAdmin);


module.exports = router;