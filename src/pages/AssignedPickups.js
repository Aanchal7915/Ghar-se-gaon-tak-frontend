import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import moment from 'moment';

const AssignedPickups = ({ setActiveTab }) => {
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAssignedPickups = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/return-replace/admin/assigned-pickups');
            setPickups(response.data);
        } catch (err) {
            setError('Failed to fetch assigned pickups.');
            console.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignedPickups();
    }, []);

    const handleMoveToUnassigned = async (pickupId) => {
        if (!window.confirm("Are you sure you want to move this to unassigned deliveries?")) return;

        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/return-replace/admin/update-status',
                { requestId: pickupId, status: 'received' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchAssignedPickups();
            setActiveTab('unassignedOrders');
        } catch (err) {
            console.error(err);
            alert('Failed to update status.');
        }
    };

    const handleStatusChange = async (pickupId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this pickup as '${newStatus}'?`)) return;

        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/return-replace/admin/update-status',
                { requestId: pickupId, status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Status updated successfully!');
            fetchAssignedPickups();
        } catch (err) {
            console.error(err);
            alert('Failed to update status.');
        }
    };

    if (loading) return <div className="text-center mt-10">Loading assigned pickups...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Assigned Return & Replacement Pickups</h2>
            <div className="space-y-4">
                {pickups.length > 0 ? (
                    pickups.map(pickup => (
                        <div key={pickup._id} className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold">Request ID: {pickup._id}</h3>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="mt-2"><strong>Order ID:</strong> {pickup.order?.orderNumber}</p>
                                    <div className="flex items-start space-x-4 my-2">
                                        {pickup.originalItem?.product?.images?.[0] ? (
                                            <img
                                                src={pickup.originalItem.product.images[0]}
                                                alt={pickup.originalItem.name}
                                                className="w-20 h-20 object-cover rounded shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">No Image</div>
                                        )}
                                        <div>
                                            <p><strong>Product:</strong> {pickup.originalItem?.name || 'Product Details Not Available'}</p>
                                            <p className="text-sm text-gray-500">Qty: {pickup.originalItem?.qty} | Pack: {pickup.originalItem?.size}</p>
                                            <p><strong>Request Type:</strong> <span className="capitalize">{pickup.type}</span></p>
                                            <p><strong>Status:</strong> <button onClick={() => handleMoveToUnassigned(pickup._id)} className="text-blue-600 font-bold hover:underline">Unassigned Deliveries</button></p>
                                        </div>
                                    </div>
                                    <div className="mt-4 border-t pt-4">
                                        <p><strong>Customer:</strong> {pickup.user?.name}</p>
                                        <p><strong>Email:</strong> {pickup.user?.email}</p>
                                        <p><strong>Phone:</strong> {pickup.user?.phone}</p>
                                        <p><strong>Pickup Address:</strong> {pickup.order?.shippingAddress?.address}, {pickup.order?.shippingAddress?.city}, {pickup.order?.shippingAddress?.postalCode}</p>

                                        <p><strong>Assigned to:</strong> {pickup.pickupPerson?.name} ({pickup.pickupPerson?.email})</p>
                                        <p><strong>Assigned On:</strong> {moment(pickup.updatedAt).format('MMMM Do YYYY, h:mm a')}</p>
                                    </div>
                                </div>
                                {/* Status update section removed as per requirement */}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No assigned pickups found.</p>
                )}
            </div>
        </div>
    );
};

export default AssignedPickups;