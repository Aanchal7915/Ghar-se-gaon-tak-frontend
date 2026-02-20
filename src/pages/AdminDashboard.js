

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

import ProductManagement from '../components/ProductManagement';
import UserManagement from '../components/UserManagement';
import CreateUser from '../components/CreateUser';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import CompletedOrders from '../components/CompletedOrders';
import CancelledOrders from '../components/CancelledOrders';
import ReturnReplaceRequests from '../components/ReturnReplaceRequests';
import CompletedCancelledRequests from '../components/CompletedCancelledRequests';
import AssignedPickups from './AssignedPickups';

const AdminDashboard = () => {
    const [unassignedOrders, setUnassignedOrders] = useState([]);
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('unassignedOrders');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [orderToAssign, setOrderToAssign] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState('');
    const [refreshFlag, setRefreshFlag] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUnassigned, setFilteredUnassigned] = useState([]);
    const [filteredAssigned, setFilteredAssigned] = useState([]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [unassignedRes, partnersRes, assignedRes] = await Promise.all([
                apiClient.get('/orders/unassigned'),
                apiClient.get('/users/delivery-partners'),
                apiClient.get('/orders/assigned'),
            ]);

            setUnassignedOrders(unassignedRes.data);
            setDeliveryPartners(partnersRes.data);
            setAssignedOrders(assignedRes.data);
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchAllData();
    }, [refreshFlag]);

    useEffect(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        // Filter unassigned orders

        const unassignedResults = unassignedOrders.filter(order =>
            (order.customerInfo?.name || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.customerInfo?.phone || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.user?.email || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.orderNumber || '').toLowerCase().includes(lowercasedSearchTerm)
        );
        setFilteredUnassigned(unassignedResults);

        // Filter assigned orders
        const assignedResults = assignedOrders.filter(order =>
            (order.customerInfo?.name || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.customerInfo?.phone || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.user?.email || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.assignedTo?.name || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (order.orderNumber || '').toLowerCase().includes(lowercasedSearchTerm)
        );
        setFilteredAssigned(assignedResults);
    }, [searchTerm, unassignedOrders, assignedOrders]);

    const handleAssignClick = (order) => {
        setOrderToAssign(order);
        setShowAssignModal(true);
    };

    const handleAssignOrder = async () => {
        if (!selectedPartner) {
            alert('Please select a delivery partner.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                '/delivery/assign',
                { orderId: orderToAssign._id, deliveryPersonId: selectedPartner },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Order assigned successfully!');
            setShowAssignModal(false);
            setOrderToAssign(null);
            setSelectedPartner('');
            setRefreshFlag(prev => !prev);
        } catch (err) {
            setError('Failed to assign order.');
            console.error(err);
        }
    };

    const handleAdminStatusChange = async (orderId, status) => {
        const confirmChange = window.confirm(`Are you sure you want to change the status to '${status}'?`);
        if (!confirmChange) return;

        try {
            const token = localStorage.getItem('token');
            await apiClient.post(
                `/delivery/admin/update-status/${orderId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Status updated successfully!');
            setRefreshFlag(prev => !prev);
        } catch (err) {
            setError('Failed to update status.');
            console.error(err);
        }
    };

    if (loading) return <div className="text-center mt-10">Loading admin dashboard...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    <button onClick={() => setActiveTab('unassignedOrders')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'unassignedOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Unassigned Deliveries</button>
                    <button onClick={() => setActiveTab('assignedOrders')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'assignedOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Assigned Deliveries</button>
                    <button onClick={() => setActiveTab('products')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'products' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Products</button>
                    <button onClick={() => setActiveTab('users')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Users</button>
                    <button onClick={() => setActiveTab('createUser')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'createUser' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Create User</button>
                    <button onClick={() => setActiveTab('analytics')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'analytics' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Analytics</button>
                    <button onClick={() => setActiveTab('completedOrders')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'completedOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Completed</button>
                    <button onClick={() => setActiveTab('cancelledOrders')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'cancelledOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cancelled</button>
                    <button onClick={() => setActiveTab('pendingReturns')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'pendingReturns' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Return Requests</button>
                    <button onClick={() => setActiveTab('assignedPickups')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'assignedPickups' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Pickup Tasks</button>
                    <button onClick={() => setActiveTab('completedReturns')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'completedReturns' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Completed Returns</button>
                    <button onClick={() => setActiveTab('cancelledReturns')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'cancelledReturns' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cancelled Returns</button>
                </nav>
            </div>

            {activeTab === 'unassignedOrders' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Unassigned Deliveries</h2>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="p-2 border rounded-md"
                        />
                    </div>
                    <div className="space-y-4">
                        {filteredUnassigned.length > 0 ? filteredUnassigned.map(order => (
                            <div key={order._id} className="bg-white rounded-lg shadow-md p-6 flex justify-between items-start flex-col md:flex-row">
                                <div className="w-full md:w-1/2">
                                    <p><strong>Order ID:</strong> {order.orderNumber}</p>
                                    <p><strong>Customer:</strong> {order.customerInfo?.name}</p>
                                    <p><strong>Phone:</strong> {order.customerInfo?.phone || 'N/A'}</p>


                                    <p><strong>Email:</strong> {order.user?.email}</p>

                                    {/* <p><strong>Phone:</strong> {order.customerInfo?.phone || 'N/A'}</p> */}
                                    <p><strong>Address:</strong> {order.shippingAddress?.address}, {order.shippingAddress?.city} {order.shippingAddress?.postalCode}</p>
                                    <p><strong>Total Price:</strong> ₹{order.totalPrice}</p>
                                </div>
                                <div className="w-full md:w-1/2 flex items-center justify-end md:justify-end mt-4 md:mt-0 space-x-4">
                                    <div className="flex flex-col items-end">
                                        <p className="font-semibold">Products:</p>
                                        <div className="space-y-2 mt-2">
                                            {order.orderItems.map((item) => (
                                                <div key={item._id} className="flex items-center space-x-2">
                                                    <img
                                                        src={item.product?.images?.[0]}
                                                        alt={item.name}
                                                        className="w-16 h-16 object-cover rounded"
                                                    />
                                                    <p className="text-sm">{item.name} (Pack: {item.size})</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => handleAssignClick(order)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 self-start md:self-auto">Assign</button>
                                </div>
                            </div>
                        )) : <p>No unassigned orders found.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'assignedOrders' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Assigned Deliveries</h2>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="p-2 border rounded-md"
                        />
                    </div>
                    <div className="space-y-4">
                        {filteredAssigned.length > 0 ? filteredAssigned.map(order => (
                            <div key={order._id} className="bg-white rounded-lg shadow-md p-6 flex justify-between items-start flex-col md:flex-row">
                                <div className="w-full md:w-1/2">
                                    <p><strong>Order ID:</strong> {order.orderNumber}</p>
                                    <p><strong>Customer:</strong> {order.customerInfo?.name} ({order.user?.email})</p>
                                    <p><strong>Phone:</strong> {order.customerInfo?.phone || 'N/A'}</p>
                                    <p><strong>Address:</strong> {order.shippingAddress?.address}, {order.shippingAddress?.city} {order.shippingAddress?.postalCode}</p>
                                    <p><strong>Assigned To:</strong> {order.assignedTo?.name} ({order.assignedTo?.email})</p>
                                    <p><strong>Status:</strong> <span className="capitalize">{order.status}</span></p>
                                    <p><strong>Total Price:</strong> ₹{order.totalPrice}</p>
                                </div>
                                <div className="w-full md:w-1/2 flex items-center justify-end md:justify-end mt-4 md:mt-0 space-x-4">
                                    <div className="flex flex-col items-end">
                                        <p className="font-semibold">Products:</p>
                                        <div className="space-y-2 mt-2">
                                            {order.orderItems.map((item) => (
                                                <div key={item._id} className="flex items-center space-x-2">
                                                    <img
                                                        src={item.product?.images?.[0]}
                                                        alt={item.name}
                                                        className="w-16 h-16 object-cover rounded"
                                                    />
                                                    <p className="text-sm">{item.name} (Pack: {item.size})</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 mt-4 md:mt-0">
                                        <button onClick={() => handleAdminStatusChange(order._id, 'delivered')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Complete</button>
                                        <button onClick={() => handleAdminStatusChange(order._id, 'cancelled')} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Cancel</button>
                                        <button onClick={() => handleAssignClick(order)} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">Reassign</button>
                                    </div>
                                </div>
                            </div>
                        )) : <p>No assigned orders found.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'pendingReturns' && <ReturnReplaceRequests deliveryPartners={deliveryPartners} setActiveTab={setActiveTab} />}
            {activeTab === 'assignedPickups' && <AssignedPickups setActiveTab={setActiveTab} />}
            {activeTab === 'completedReturns' && <CompletedCancelledRequests type="completed" />}
            {activeTab === 'cancelledReturns' && <CompletedCancelledRequests type="cancelled" />}
            {activeTab === 'products' && <ProductManagement />}
            {activeTab === 'users' && <UserManagement />}
            {/* {activeTab === 'users' && <UserManagement onUserListUpdated={fetchAllData} />} */}
            {activeTab === 'createUser' && <CreateUser onUserCreated={fetchAllData} />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'completedOrders' && <CompletedOrders refreshFlag={refreshFlag} />}
            {activeTab === 'cancelledOrders' && <CancelledOrders refreshFlag={refreshFlag} />}

            {showAssignModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">Assign Order to Delivery Partner</h3>
                        <p className="mb-2"><strong>Order:</strong> {orderToAssign.customerInfo?.name}'s order</p>
                        <select onChange={(e) => setSelectedPartner(e.target.value)} className="w-full p-2 border rounded-md">
                            <option value="">Select Delivery Partner</option>
                            {deliveryPartners.map(partner => (
                                <option key={partner._id} value={partner._id}>{partner.name} ({partner.email})</option>
                            ))}
                        </select>
                        <div className="mt-6 flex justify-between space-x-4">
                            <button onClick={() => setShowAssignModal(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Cancel</button>
                            <button onClick={handleAssignOrder} className="bg-green-600 text-white px-4 py-2 rounded-md" disabled={!selectedPartner}>Confirm Assign</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;