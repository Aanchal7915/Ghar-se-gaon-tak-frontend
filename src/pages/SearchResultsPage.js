import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import apiClient from '../services/apiClient';

const SearchResultsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('q');

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!query) {
                setProducts([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                // Use params object for cleaner query string handling
                const response = await apiClient.get('/products/search', {
                    params: { keyword: query }
                });
                setProducts(response.data);
                setError(null);
            } catch (err) {
                console.error("Search error:", err);
                const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch search results.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col mb-8">
                <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                    Search Results for "{query}"
                </h1>
                <div className="h-1.5 w-24 bg-green-600 rounded-full"></div>
                {products.length > 0 && (
                    <p className="mt-4 text-gray-600 font-medium">
                        Found {products.length} {products.length === 1 ? 'product' : 'products'}
                    </p>
                )}
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-2xl text-center font-bold">
                    Error: {error}
                </div>
            ) : products.length === 0 ? (
                <div className="bg-gray-50 border border-gray-100 p-12 rounded-2xl text-center">
                    <p className="text-xl text-gray-800 font-bold mb-2">No products found</p>
                    <p className="text-gray-500">Try searching for something else like "Tomato", "Milk", or "Bread".</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4">
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchResultsPage;