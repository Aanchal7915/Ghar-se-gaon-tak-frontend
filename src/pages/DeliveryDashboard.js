

import React, { useState, useEffect } from 'react';

import DeliveredOrdersAnalytics from '../components/DeliveredOrdersAnalytics';
import LiveLocationTracker from '../components/LiveLocationTracker';
import moment from 'moment';
import apiClient from '../services/apiClient';

const DeliveryDashboard = () => {
    const [assignedDeliveries, setAssignedDeliveries] = useState([]);
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    const [cancelledOrders, setCancelledOrders] = useState([]);
    const [assignedPickups, setAssignedPickups] = useState([]);
    const [completedPickups, setCompletedPickups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [currentDelivery, setCurrentDelivery] = useState(null);
    const [activeTab, setActiveTab] = useState('assigned');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [assignedRes, deliveredRes, cancelledRes, pickupsRes, completedPickupsRes] = await Promise.all([
                apiClient.get('/delivery/my-deliveries'),
                apiClient.get('/delivery/delivered-orders'),
                apiClient.get('/delivery/cancelled-orders'),
                apiClient.get('/return-replace/my-pickups'),
                apiClient.get(`/return-replace/my-pickups/completed?month=${filterMonth}&year=${filterYear}`),
            ]);

            setAssignedDeliveries(assignedRes.data);
            setDeliveredOrders(
                deliveredRes.data.filter(d => {
                    const orderNum = d.order?.orderNumber || '';
                    return !orderNum.startsWith('REP-') && !orderNum.startsWith('RET-');
                })
            );
            setCancelledOrders(cancelledRes.data);
            setAssignedPickups(pickupsRes.data);
            setCompletedPickups(completedPickupsRes.data);
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchAllData();
    }, [filterMonth, filterYear]);

    const handleUpdateStatus = async (delivery, status) => {
        if (!delivery || !delivery.order || !delivery.order._id) {
            alert('Invalid delivery or order information.');
            console.error('Delivery or Order ID is missing', delivery);
            return;
        }

        setCurrentDelivery({ ...delivery, newStatus: status });
        if (status === 'out for delivery') {
            try {
                const token = localStorage.getItem('token');
                await apiClient.post(
                    '/delivery/update-status',
                    { orderId: delivery.order._id, status },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Status updated to "Out for Delivery".');
                fetchAllData();
            } catch (error) {
                console.error('Update status error:', error.response?.data || error.message);
                alert(error.response?.data?.message || 'Failed to update status.');
            }
        } else {
            try {
                const token = localStorage.getItem('token');
                await apiClient.post('/delivery/send-otp', { orderId: delivery.order._id }, { headers: { Authorization: `Bearer ${token}` } });
                setShowOtpModal(true);
                alert('OTP sent to customer.');
            } catch (error) {
                console.error('Send OTP error:', error.response?.data || error.message);
                alert(error.response?.data?.message || 'Failed to send OTP.');
            }
        }
    };

    const handleVerifyAndChangeStatus = async () => {
        if (!otpInput || !currentDelivery) return;
        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/delivery/update-status',
                {
                    orderId: currentDelivery.order._id,
                    otp: otpInput,
                    status: currentDelivery.newStatus
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Status updated successfully!');
            setShowOtpModal(false);
            setOtpInput('');
            fetchAllData();
        } catch (error) {
            console.error('Verify and update status error:', error.response?.data || error.message);
            alert(error.response?.data?.message || 'Failed to update status.');
        }
    };

    const handlePickupStatusChange = async (pickup, status) => {
        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/return-replace/pickup-status',
                { requestId: pickup._id, status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Pickup status updated successfully!');
            fetchAllData();
        } catch (error) {
            console.error('Update pickup status error:', error.response?.data || error.message);
            alert(error.response?.data?.message || 'Failed to update pickup status.');
        }
    };

    if (loading) return <div className="text-center mt-10">Loading deliveries...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Delivery Dashboard</h1>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('assigned')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'assigned' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Assigned Deliveries</button>
                    <button onClick={() => setActiveTab('pickups')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'pickups' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Pickup Assignments</button>
                    <button onClick={() => setActiveTab('delivered')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'delivered' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Delivered Orders</button>
                    <button onClick={() => setActiveTab('cancelled')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'cancelled' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cancelled Orders</button>
                    <button onClick={() => setActiveTab('completedPickups')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'completedPickups' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Completed Pickups</button>
                    <button onClick={() => setActiveTab('tracker')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'tracker' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Live Tracker</button>
                </nav>
            </div>

            {activeTab === 'assigned' && (
                <div className="space-y-4">
                    {assignedDeliveries.length > 0 ? (
                        assignedDeliveries.map(delivery => (
                            <div key={delivery._id} className="bg-white rounded-lg shadow-md p-6">
                                <p><strong>Order ID:</strong> {delivery.order?.orderNumber}</p>
                                <p><strong>Customer:</strong> {delivery.order?.user?.name} ({delivery.order?.user?.phone})</p>
                                <p><strong>Email:</strong> {delivery.order?.user?.email}</p>
                                <p><strong>Address:</strong> {delivery.order?.shippingAddress?.address}, {delivery.order?.shippingAddress?.city}, {delivery.order?.shippingAddress?.postalCode}</p>

                                <p><strong>Status:</strong> <span className="capitalize">{delivery.status}</span></p>
                                <div className="mt-4 flex space-x-2">
                                    <button onClick={() => handleUpdateStatus(delivery, 'out for delivery')} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Out for Delivery</button>
                                    <button onClick={() => handleUpdateStatus(delivery, 'delivered')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Delivered</button>
                                    <button onClick={() => handleUpdateStatus(delivery, 'cancelled')} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Cancel</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No deliveries have been assigned to you yet.</p>
                    )}
                </div>
            )}

            {activeTab === 'pickups' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold mb-4">Your Pickup Assignments</h2>
                    {assignedPickups.filter(p => p.status !== 'received').length > 0 ? (
                        assignedPickups.filter(p => p.status !== 'received').map(pickup => (
                            <div key={pickup._id} className="bg-white rounded-lg shadow-md p-6">
                                <p><strong>Order Number:</strong> {pickup.order?.orderNumber}</p>
                                <p><strong>Customer:</strong> {pickup.user?.name} ({pickup.user?.phone})</p>
                                <p><strong>Email:</strong> {pickup.user?.email}</p>
                                <p><strong>Address:</strong> {pickup.order?.shippingAddress?.address}, {pickup.order?.shippingAddress?.city}, {pickup.order?.shippingAddress?.postalCode}</p>

                                <p><strong>Request Type:</strong> <span className="capitalize">{pickup.type}</span></p>
                                <p><strong>Reason:</strong> {pickup.reason}</p>
                                <p><strong>Status:</strong> <span className="capitalize">{pickup.status === 'out for pickup' ? 'Pickup' : pickup.status}</span></p>
                                <div className="mt-4 flex space-x-2">
                                    <button
                                        onClick={() => handlePickupStatusChange(pickup, 'received')}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                    >
                                        Mark as Received
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No pickup assignments found.</p>
                    )}
                </div>
            )}


            {activeTab === 'delivered' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold mb-4">Your Delivered Orders</h2>
                    {deliveredOrders.length > 0 ? (
                        deliveredOrders.map(delivery => (
                            <div key={delivery._id} className="bg-white rounded-lg shadow-md p-6">
                                <p><strong>Order ID:</strong> {delivery.order?.orderNumber}</p>
                                <p><strong>Customer:</strong> {delivery.order?.user?.name} ({delivery.order?.user?.phone})</p>
                                <p><strong>Email:</strong> {delivery.order?.user?.email}</p>
                                <p><strong>Address:</strong> {delivery.order?.shippingAddress?.address}, {delivery.order?.shippingAddress?.city}, {delivery.order?.shippingAddress?.postalCode}</p>

                                <p><strong>Status:</strong> <span className="capitalize text-green-600">{delivery.status}</span></p>
                                <p><strong>Delivered On:</strong> {moment(delivery.deliveredAt).format('MMMM Do YYYY, h:mm:ss a')}</p>
                            </div>
                        ))
                    ) : (
                        <p>No delivered orders found.</p>
                    )}
                </div>
            )}

            {activeTab === 'cancelled' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold mb-4">Your Cancelled Orders</h2>
                    {cancelledOrders.length > 0 ? (
                        cancelledOrders.map(delivery => (
                            <div key={delivery._id} className="bg-white rounded-lg shadow-md p-6">
                                <p><strong>Order ID:</strong> {delivery.order?.orderNumber}</p>
                                <p><strong>Customer:</strong> {delivery.order?.user?.name} ({delivery.order?.user?.phone})</p>
                                <p><strong>Email:</strong> {delivery.order?.user?.email}</p>
                                <p><strong>Address:</strong> {delivery.order?.shippingAddress?.address}, {delivery.order?.shippingAddress?.city}, {delivery.order?.shippingAddress?.postalCode}</p>

                                <p><strong>Status:</strong> <span className="capitalize text-red-600">{delivery.status}</span></p>
                                <p><strong>Cancelled On:</strong> {moment(delivery.updatedAt).format('MMMM Do YYYY, h:mm:ss a')}</p>
                            </div>
                        ))
                    ) : (
                        <p>No cancelled orders found.</p>
                    )}
                </div>
            )}

            {activeTab === 'completedPickups' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold mb-4">Completed Pickups</h2>
                    <div className="flex space-x-4 mb-4">
                        <input
                            type="number"
                            placeholder="Year"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="p-2 border rounded"
                        />
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="p-2 border rounded"
                        >
                            <option value="">Select Month</option>
                            {moment.months().map((month, index) => (
                                <option key={index} value={index + 1}>{month}</option>
                            ))}
                        </select>
                    </div>
                    {completedPickups.length > 0 ? (
                        completedPickups.map(pickup => (
                            <div key={pickup._id} className="bg-white rounded-lg shadow-md p-6">
                                <p><strong>Order Number:</strong> {pickup.order?.orderNumber}</p>
                                <p><strong>Customer:</strong> {pickup.user?.name} ({pickup.user?.phone})</p>
                                <p><strong>Email:</strong> {pickup.user?.email}</p>
                                <p><strong>Address:</strong> {pickup.order?.shippingAddress?.address}, {pickup.order?.shippingAddress?.city}, {pickup.order?.shippingAddress?.postalCode}</p>

                                <p><strong>Request Type:</strong> <span className="capitalize">{pickup.type}</span></p>
                                <p><strong>Reason:</strong> {pickup.reason}</p>
                                <p><strong>Status:</strong> <span className="capitalize text-green-600">{pickup.status}</span></p>
                                <p><strong>Completed On:</strong> {moment(pickup.pickupDeliveredAt).format('MMMM Do YYYY, h:mm:ss a')}</p>
                            </div>
                        ))
                    ) : (
                        <p>No completed pickups found.</p>
                    )}
                </div>
            )}

            {activeTab === 'tracker' && <LiveLocationTracker />}

            {showOtpModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">Verify with OTP</h3>
                        <p className="text-gray-600 mb-4">An OTP has been sent to the customer's email. Please enter it to update the status.</p>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                placeholder="Enter OTP"
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div className="mt-6 flex justify-between space-x-4">
                            <button onClick={() => { setShowOtpModal(false); setOtpInput(''); }} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Cancel</button>
                            <button onClick={handleVerifyAndChangeStatus} className="bg-green-600 text-white px-4 py-2 rounded-md">Verify & Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default DeliveryDashboard;