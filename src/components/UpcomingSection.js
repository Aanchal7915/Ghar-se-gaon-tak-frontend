import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../services/apiClient';
import ProductCard from './ProductCard';
import { FaCalendarAlt } from 'react-icons/fa';

const UpcomingSection = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpcoming = async () => {
            try {
                const pincode = localStorage.getItem("selectedPincode");
                const response = await apiClient.get('/products/upcoming', {
                    params: { pincode }
                });
                setProducts(response.data);
            } catch (error) {
                console.error('Failed to fetch upcoming products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUpcoming();

        const handlePincodeUpdate = () => {
            fetchUpcoming();
        };
        window.addEventListener("pincode-updated", handlePincodeUpdate);
        return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
    }, []);

    if (loading || products.length === 0) return null;

    return (
        <section className="pt-0 pb-12 bg-white overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                    <div className="flex flex-col">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="flex items-center space-x-2 text-orange-600 font-bold uppercase tracking-[0.2em] text-xs mb-2"
                        >
                            <FaCalendarAlt className="animate-pulse" />
                            <span>Coming Soon</span>
                        </motion.div>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                            Upcoming <span className="text-orange-600 text-stroke-thin">Products</span>
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                    {products.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-400">
                            Check back soon for upcoming products!
                        </div>
                    ) : products.map((product, idx) => (
                        <motion.div
                            key={product._id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className="relative group">
                                <ProductCard product={product} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default UpcomingSection;
