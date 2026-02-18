import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft, FaMapMarkerAlt, FaPhone, FaUser } from 'react-icons/fa';

const CartPage = () => {
    const { cartItems, removeFromCart, updateCartQuantity, getTotalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
    const [shippingAddress, setShippingAddress] = useState({ address: '', city: '', postalCode: '' });
    const [customerLocation, setCustomerLocation] = useState({ latitude: null, longitude: null });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCustomerLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                }
            );
        }
    }, []);

    const handleCheckout = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to checkout.');
            navigate('/login');
            return;
        }

        if (cartItems.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        try {
            const orderData = {
                orderItems: cartItems.map(item => ({
                    name: item.name,
                    qty: item.qty,
                    price: item.selectedVariant.price,
                    product: item._id,
                    size: item.selectedVariant.size,
                })),
                totalPrice: getTotalPrice(),
                customerInfo,
                shippingAddress,
                customerLocation,
            };

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            const orderResponse = await apiClient.post('/orders', orderData, config);
            const createdOrder = orderResponse.data;

            const razorpayResponse = await apiClient.post(`/orders/${createdOrder._id}/razorpay`, {}, config);
            const razorpayOrder = razorpayResponse.data;

            const options = {
                key: razorpayOrder.key_id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: "Rohtak Grocery",
                description: `Order #${createdOrder.orderNumber}`,
                order_id: razorpayOrder.id,
                handler: async function (response) {
                    await apiClient.post(
                        `/orders/${createdOrder._id}/verify-payment`,
                        response,
                        config
                    );
                    alert("Payment successful! Your order has been placed.");
                    clearCart();
                    navigate('/myorders');
                },
                prefill: {
                    email: createdOrder.user.email,
                },
                theme: {
                    color: "#16a34a", // Green color for Razorpay modal matching the button
                },
            };
            const rzp1 = new window.Razorpay(options);
            rzp1.open();

        } catch (error) {
            console.error('Checkout failed:', error.response?.data?.message || error.message);
            alert('Checkout failed. Please try again.');
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
                    <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
                    <Link
                        to="/shop"
                        className="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition duration-300 shadow-lg"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center mb-8">
                    <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900">
                        <FaArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Shopping Cart ({cartItems.length})</h1>
                </div>

                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                    {/* Cart Items List */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                            <ul className="divide-y divide-gray-100">
                                {cartItems.map((item) => {
                                    const availableStock = item.selectedVariant?.countInStock || 0;
                                    const unitPrice = item.selectedVariant?.price || 0;

                                    return (
                                        <li key={`${item._id}-${item.selectedVariant?.size}`} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200">
                                            <div className="flex items-center sm:items-start">
                                                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                    <img
                                                        src={item.images[0]}
                                                        alt={item.name}
                                                        className="w-full h-full object-contain mix-blend-multiply"
                                                    />
                                                </div>
                                                <div className="ml-4 sm:ml-6 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between">
                                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 pr-4">{item.name}</h3>
                                                            <p className="text-lg font-bold text-green-600 whitespace-nowrap">₹{unitPrice * item.qty}</p>
                                                        </div>
                                                        <p className="mt-1 text-sm text-gray-500">Pack: {item.selectedVariant?.size}</p>
                                                        <p className="text-xs text-gray-400">Unit Price: ₹{unitPrice}</p>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between">
                                                        <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-sm max-w-[120px]">
                                                            <button
                                                                onClick={() => updateCartQuantity(item._id, item.selectedVariant.size, item.qty - 1)}
                                                                disabled={item.qty <= 1}
                                                                className="px-3 py-1 text-gray-600 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <FaMinus className="w-3 h-3" />
                                                            </button>
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                value={item.qty}
                                                                className="w-8 text-center text-gray-900 font-semibold focus:outline-none border-x border-gray-200 py-1"
                                                            />
                                                            <button
                                                                onClick={() => updateCartQuantity(item._id, item.selectedVariant.size, item.qty + 1)}
                                                                disabled={item.qty >= availableStock}
                                                                className="px-3 py-1 text-gray-600 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <FaPlus className="w-3 h-3" />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => removeFromCart(item._id, item.selectedVariant.size)}
                                                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                            title="Remove item"
                                                        >
                                                            <FaTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    {/* Checkout Details */}
                    <div className="lg:col-span-5 mt-8 lg:mt-0">
                        <form onSubmit={handleCheckout} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-4">
                            <div className="p-6 bg-yellow-400 text-black">
                                <h2 className="text-2xl font-bold">Shipping Details</h2>
                                <p className="text-gray-600 text-sm mt-1">Free shipping on all orders</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-3">Contact Details</h3>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                            placeholder="Full Name"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaPhone className="text-gray-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={customerInfo.phone}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                            placeholder="Phone Number"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="space-y-4">
                                    <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-3">Shipping Address</h3>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaMapMarkerAlt className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={shippingAddress.address}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                                            placeholder="Street Address"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={shippingAddress.city}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                            placeholder="City"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={shippingAddress.postalCode}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                                            placeholder="Postal Code"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Total and Checkout */}
                                <div className="border-t border-gray-100 pt-6 mt-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-gray-600 font-medium">Total Amount</span>
                                        <span className="text-3xl font-bold text-gray-900">₹{getTotalPrice()}</span>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        Proceed to Checkout
                                    </button>
                                    <p className="text-center text-xs text-gray-400 mt-4">
                                        Secure Payment via Razorpay
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
