import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import ProductCard from './ProductCard';

const NewReleaseProductsSection = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const pincode = localStorage.getItem("selectedPincode");
                // Fetch recent products and limit to 8 for the homepage row
                const response = await apiClient.get('/products/recent', {
                    params: { limit: 8, pincode }
                });
                setProducts(response.data); // Revert to 8 products for desktop row
            } catch (error) {
                console.error('Failed to fetch recent products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();

        const handlePincodeUpdate = () => {
            fetchRecent();
        };
        window.addEventListener("pincode-updated", handlePincodeUpdate);
        return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
    }, []);

    if (loading) return null;
    if (products.length === 0) return null;

    return (
        <section className="pt-0 pb-12 bg-white overflow-hidden border-t border-gray-50">
            <div className="container mx-auto px-4">
                <div className="flex flex-col mb-4">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        New Releases
                    </h2>
                    <div className="h-1.5 w-20 bg-green-600 rounded-full"></div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewReleaseProductsSection;
