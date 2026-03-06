import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft, FaMapMarkerAlt, FaPhone, FaUser } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
};

const CartPage = () => {
    const { user, loading } = useAuth();
    const { cartItems, removeFromCart, updateCartQuantity, getTotalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
    const [shippingAddress, setShippingAddress] = useState({ address: '', city: '', postalCode: '' });
    const [customerLocation, setCustomerLocation] = useState({ latitude: null, longitude: null });
    const [mapCenter, setMapCenter] = useState([28.8955, 76.6066]);
    const [pinPosition, setPinPosition] = useState([28.8955, 76.6066]);
    const [showMap, setShowMap] = useState(false);
    const [modalAddressText, setModalAddressText] = useState("");
    const [orderStatus, setOrderStatus] = useState({ isOpen: true, reason: '' });
    const alertShown = useRef(false);

    useEffect(() => {
        if (loading) return; // Wait until auth state is loaded

        if (!user) {
            if (!alertShown.current) {
                alert("Please login to access your shopping cart.");
                alertShown.current = true;
                navigate("/");
            }
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setCustomerLocation({
                        latitude: lat,
                        longitude: lng,
                    });
                    setMapCenter([lat, lng]);
                    setPinPosition([lat, lng]);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                }
            );
        }

        const checkStatus = async () => {
            try {
                const { data } = await apiClient.get('/orders/status');
                // Temporarily disabling the status check for testing (User request)
                // setOrderStatus(data); 
                setOrderStatus({ isOpen: true, reason: '' });
            } catch (error) {
                console.error('Failed to check order status:', error);
            }
        };
        checkStatus();
    }, [user, loading, navigate]);

    const updateAddressFromLatLng = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.address) {
                const { road, suburb, city, town, village, postcode, house_number, neighbourhood } = data.address;
                const street = [house_number, road, neighbourhood, suburb].filter(Boolean).join(', ');
                const cityName = city || town || village || '';

                setModalAddressText(data.display_name);

                setShippingAddress({
                    address: street || data.display_name.split(',').slice(0, 2).join(', '),
                    city: cityName,
                    postalCode: postcode || ''
                });
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        }
    };

    const MapClickHandler = () => {
        useMapEvents({
            click: (e) => {
                const { lat, lng } = e.latlng;
                setPinPosition([lat, lng]);
                setCustomerLocation({ latitude: lat, longitude: lng });
                updateAddressFromLatLng(lat, lng);
            }
        });
        return null;
    };

    if (loading || !user) return null;

    const handleCheckout = async (e) => {
        e.preventDefault();

        const allowedPincodes = ['124001', '124021', '124401', '124406', '124411', '124113', '124002', '124003', '124501', '124022'];
        if (!allowedPincodes.includes(shippingAddress.postalCode.trim())) {
            alert('Delivery not available at your location. We currently serve only in Rohtak and surrounding areas.');
            return;
        }

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
                name: "Gaon se ghar tak",
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
                    email: user.email,
                },
                theme: {
                    color: "#16a34a", // Green color for Razorpay modal matching the button
                },
            };
            const rzp1 = new window.Razorpay(options);
            rzp1.open();

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            console.error('Checkout failed:', errorMessage);
            alert(`Checkout failed: ${errorMessage}`);
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
                                        <div className="flex flex-col">
                                            <input
                                                type="text"
                                                value={shippingAddress.postalCode}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                                                placeholder="Postal Code"
                                                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none ${shippingAddress.postalCode && !['124001', '124021', '124401', '124406', '124411', '124113', '124002', '124003', '124501', '124022'].includes(shippingAddress.postalCode.trim())
                                                    ? 'border-red-500'
                                                    : 'border-gray-200'
                                                    }`}
                                                required
                                            />
                                            {shippingAddress.postalCode && !['124001', '124021', '124401', '124406', '124411', '124113', '124002', '124003', '124501', '124022'].includes(shippingAddress.postalCode.trim()) && (
                                                <p className="text-[10px] text-red-500 mt-1 font-bold italic">Delivery not available at your location</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-3">Delivery Pin</h3>
                                    <div
                                        onClick={() => setShowMap(true)}
                                        className="h-16 w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group p-2 text-center"
                                    >
                                        <div className="flex items-center space-x-2 text-gray-600 group-hover:text-blue-600">
                                            <FaMapMarkerAlt className="w-5 h-5" />
                                            <span className="font-bold">Set using map pin</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 italic">Click to open map and pin location</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Lat: {customerLocation.latitude ? customerLocation.latitude.toFixed(6) : 'N/A'} | Lng: {customerLocation.longitude ? customerLocation.longitude.toFixed(6) : 'N/A'}
                                    </p>
                                </div>

                                {showMap && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative transition-all transform scale-100">
                                            {/* Header */}
                                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">Select Location</h3>
                                                    <p className="text-xs text-gray-500 mt-1">Please pin your service address</p>
                                                </div>
                                                <button type="button" onClick={() => setShowMap(false)} className="text-gray-400 hover:bg-gray-100 rounded-full transition-colors p-2">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>

                                            {/* Map Area */}
                                            <div className="h-72 sm:h-80 w-full relative">
                                                <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
                                                    <RecenterMap center={mapCenter} />
                                                    <MapClickHandler />
                                                    <TileLayer
                                                        attribution='&copy; OpenStreetMap contributors'
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <Marker
                                                        position={pinPosition}
                                                        draggable={true}
                                                        icon={markerIcon}
                                                        eventHandlers={{
                                                            dragend: (event) => {
                                                                const { lat, lng } = event.target.getLatLng();
                                                                setPinPosition([lat, lng]);
                                                                setCustomerLocation({ latitude: lat, longitude: lng });
                                                                updateAddressFromLatLng(lat, lng);
                                                            },
                                                        }}
                                                    >
                                                        <Popup>Drag pin to exact delivery location</Popup>
                                                    </Marker>
                                                </MapContainer>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!navigator.geolocation) return;
                                                        navigator.geolocation.getCurrentPosition(
                                                            (position) => {
                                                                const lat = position.coords.latitude;
                                                                const lng = position.coords.longitude;
                                                                setMapCenter([lat, lng]);
                                                                setPinPosition([lat, lng]);
                                                                setCustomerLocation({ latitude: lat, longitude: lng });
                                                                updateAddressFromLatLng(lat, lng);
                                                            },
                                                            (error) => console.error('Geolocation error:', error)
                                                        );
                                                    }}
                                                    className="absolute bottom-4 right-4 z-[400] bg-white text-blue-600 px-4 py-2.5 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors border border-blue-100"
                                                >
                                                    <FaMapMarkerAlt /> Locate Me
                                                </button>
                                            </div>

                                            {/* Footer Area */}
                                            <div className="p-5 bg-white flex flex-col gap-4">
                                                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">FINAL ADDRESS:</p>
                                                    <p className="text-sm text-gray-700 leading-snug line-clamp-2 min-h-[40px] italic">
                                                        {modalAddressText || "Click anywhere on the map above to select your location..."}
                                                    </p>
                                                </div>
                                                <button type="button" onClick={() => setShowMap(false)} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30 text-[15px]">
                                                    Confirm This Location
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Total and Checkout */}
                                <div className="border-t border-gray-100 pt-6 mt-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-gray-600 font-medium">Total Amount</span>
                                        <span className="text-3xl font-bold text-gray-900">₹{getTotalPrice()}</span>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!orderStatus.isOpen}
                                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${orderStatus.isOpen
                                            ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green-500/30'
                                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                            }`}
                                    >
                                        {orderStatus.isOpen ? 'Proceed to Checkout' : orderStatus.reason}
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
