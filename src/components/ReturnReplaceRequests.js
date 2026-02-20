


import React, { useState, useEffect } from 'react';

import apiClient from '../services/apiClient';
import moment from 'moment';

const ReturnReplaceRequests = ({ deliveryPartners, setActiveTab }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [requestToAssign, setRequestToAssign] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState('');

    const fetchPendingRequests = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/return-replace/admin/pending');
            setRequests(response.data);
        } catch (err) {
            setError('Failed to fetch requests.');
            console.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const handleAssignPickupClick = (request) => {
        setRequestToAssign(request);
        setShowAssignModal(true);
    };

    const handleAssignPickup = async () => {
        if (!selectedPartner) {
            alert('Please select a delivery partner.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/return-replace/admin/assign-pickup',
                { requestId: requestToAssign._id, deliveryPersonId: selectedPartner },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Pickup assigned successfully!');
            setShowAssignModal(false);
            setRequestToAssign(null);
            setSelectedPartner('');
            fetchPendingRequests();
        } catch (err) {
            alert('Failed to assign pickup.');
            console.error(err);
        }
    };

    const handleApproveRequest = async (requestId) => {
        if (window.confirm('Are you sure you want to approve this request?')) {
            try {
                const token = localStorage.getItem('token');
                await apiClient.post(
                    '/return-replace/admin/approve-request',
                    { requestId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Request approved successfully!');
                fetchPendingRequests();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to approve request.');
                console.error(err);
            }
        }
    };

    const handleMoveToUnassigned = async (requestId) => {
        if (!window.confirm("Are you sure you want to move this request to unassigned deliveries?")) return;

        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/return-replace/admin/update-status',
                { requestId: requestId, status: 'received' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchPendingRequests();
            setActiveTab('unassignedOrders');
        } catch (err) {
            console.error(err);
            alert('Failed to update status.');
        }
    };

    const handleRejectRequest = async (requestId) => {
        // Prompt the admin for a rejection reason
        const reason = window.prompt("Please provide a reason for rejecting this request:");
        if (!reason) {
            return alert('Rejection reason is required.');
        }

        if (window.confirm('Are you sure you want to reject this request?')) {
            try {
                const token = localStorage.getItem('token');
                await apiClient.post(
                    '/return-replace/admin/reject-request',
                    { requestId, reason }, // Pass the reason to the backend
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Request rejected successfully!');
                fetchPendingRequests(); // Refresh the list
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to reject request.');
                console.error(err);
            }
        }
    };

    if (loading) return <div className="text-center mt-10">Loading requests...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Pending Return & Replacement Requests</h2>
            <div className="space-y-4">
                {requests.length > 0 ? (
                    requests.map(request => (
                        <div key={request._id} className="bg-white rounded-lg shadow-md p-6">
                            <p><strong>Request ID:</strong> {request._id}</p>
                            <p><strong>Order Number:</strong> {request.order?.orderNumber}</p>
                            <p><strong>Customer:</strong> {request.user?.name} ({request.user?.phone})</p>
                            <p><strong>Email:</strong> {request.user?.email}</p>
                            <p><strong>Address:</strong> {request.order?.shippingAddress?.address}, {request.order?.shippingAddress?.city}, {request.order?.shippingAddress?.postalCode}</p>

                            <p><strong>Type:</strong> <span className="capitalize">{request.type}</span></p>
                            <div className="flex items-center space-x-4 my-3 p-3 bg-gray-50 rounded-lg">
                                {request.originalItem?.product?.images?.[0] ? (
                                    <img
                                        src={request.originalItem.product.images[0]}
                                        alt={request.originalItem.name}
                                        className="w-16 h-16 object-cover rounded shadow-sm"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">No Image</div>
                                )}
                                <div>
                                    <p className="font-bold text-gray-800">{request.originalItem?.name || 'Product Details Not Available'}</p>
                                    <p className="text-sm text-gray-500">Qty: {request.originalItem?.qty} | Pack: {request.originalItem?.size}</p>
                                    <p className="text-sm font-bold text-indigo-600 font-sans">₹{request.originalItem?.price}</p>
                                </div>
                            </div>
                            <p><strong>Reason:</strong> {request.reason}</p>
                            <p><strong>Status:</strong> <button onClick={() => handleMoveToUnassigned(request._id)} className="text-blue-600 font-bold hover:underline">Unassigned Deliveries</button></p>
                            <div className="mt-4 flex space-x-2">
                                {request.status === 'pending' && (
                                    <button
                                        onClick={() => handleApproveRequest(request._id)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                    >
                                        Approve Request
                                    </button>
                                )}
                                {request.status === 'approved' && (
                                    <button
                                        onClick={() => handleAssignPickupClick(request)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                    >
                                        Assign for Pickup
                                    </button>
                                )}
                                {(request.status === 'pending' || request.status === 'approved') && (
                                    <button
                                        onClick={() => handleRejectRequest(request._id)}
                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                                    >
                                        Reject Request
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No pending requests found.</p>
                )}
            </div>

            {/* Assign Pickup Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">Assign Pickup to Delivery Partner</h3>
                        <p className="mb-2"><strong>Request Type:</strong> <span className="capitalize">{requestToAssign.type}</span></p>
                        <select
                            onChange={(e) => setSelectedPartner(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Select Delivery Partner</option>
                            {deliveryPartners.map(partner => (
                                <option key={partner._id} value={partner._id}>{partner.name} ({partner.email})</option>
                            ))}
                        </select>
                        <div className="mt-6 flex justify-between space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowAssignModal(false)}
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAssignPickup}
                                className="bg-green-600 text-white px-4 py-2 rounded-md"
                                disabled={!selectedPartner}
                            >
                                Confirm Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturnReplaceRequests;