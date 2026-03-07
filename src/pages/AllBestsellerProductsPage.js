import React, { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import FilterSidebar from "../components/FilterSidebar";

const AllBestsellerProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters state (price will be set once products load)
    const [filters, setFilters] = useState({
        price: [0, 100000],
        gender: [],
        category: [],
        subCategory: [],
        size: [],
        brand: [],
    });

    // mobile drawer state
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    useEffect(() => {
        const fetchBestsellerProducts = async () => {
            try {
                setLoading(true);
                const pincode = localStorage.getItem("selectedPincode");
                const response = await apiClient.get('/products/bestseller', {
                    params: { pincode }
                });
                setProducts(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setTimeout(() => {
                    setLoading(false);
                }, 800);
            }
        };
        fetchBestsellerProducts();

        const handlePincodeUpdate = () => {
            fetchBestsellerProducts();
        };
        window.addEventListener("pincode-updated", handlePincodeUpdate);
        return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
    }, []);


    // When products load, compute global min/max
    useEffect(() => {
        if (!products?.length) return;

        const allPrices = products.flatMap((p) => {
            if (Array.isArray(p.variants) && p.variants.length) {
                return p.variants
                    .map((v) => Number(v?.price ?? NaN))
                    .filter((n) => !Number.isNaN(n));
            }
            if (p.price != null) {
                const n = Number(p.price);
                return Number.isNaN(n) ? [] : [n];
            }
            return [];
        });

        if (allPrices.length) {
            const min = Math.min(...allPrices);
            const max = Math.max(...allPrices);
            setFilters((prev) => ({ ...prev, price: [min, max] }));
        }
    }, [products]);

    if (loading) return <LoadingSpinner />;
    if (error)
        return <div className="text-center py-12 text-red-500">Error: {error}</div>;

    const normalizeValue = (val) => (typeof val === "string" ? val : val?.name || "");

    const categories = [
        ...new Set(products.map((p) => normalizeValue(p.category)).filter(Boolean)),
    ].sort();
    const subCategories = [
        ...new Set(products.map((p) => normalizeValue(p.subCategory)).filter(Boolean)),
    ].sort();
    const brands = [
        ...new Set(products.map((p) => normalizeValue(p.brand)).filter(Boolean)),
    ].sort();

    const filteredProducts = products.filter((p) => {
        const [minFilter, maxFilter] = filters.price ?? [0, Infinity];

        const productPrices =
            Array.isArray(p.variants) && p.variants.length
                ? p.variants.map((v) => Number(v?.price)).filter((n) => !Number.isNaN(n))
                : p.price != null
                    ? [Number(p.price)].filter((n) => !Number.isNaN(n))
                    : [];

        if (!productPrices.length) return false;

        const priceMatch = productPrices.some(
            (price) => price >= minFilter && price <= maxFilter
        );
        if (!priceMatch) return false;

        if (filters.gender.length && !filters.gender.includes(p.gender)) return false;

        const productCategory = normalizeValue(p.category);
        if (filters.category.length && !filters.category.includes(productCategory))
            return false;

        const productSubCategory = normalizeValue(p.subCategory);
        if (
            filters.subCategory.length &&
            !filters.subCategory.includes(productSubCategory)
        )
            return false;

        if (filters.size.length) {
            const sizes =
                Array.isArray(p.variants)
                    ? p.variants.map((v) => String(v.size)).filter(Boolean)
                    : p.size
                        ? [String(p.size)]
                        : [];
            if (!sizes.some((s) => filters.size.includes(s))) return false;
        }

        const productBrand = normalizeValue(p.brand);
        if (filters.brand.length && !filters.brand.includes(productBrand))
            return false;

        return true;
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="md:hidden mb-4 flex justify-start">
                <button
                    onClick={() => setMobileFilterOpen(true)}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-semibold shadow-sm flex items-center gap-1"
                >
                    Open Filters
                </button>
            </div>

            <div className="flex gap-8">
                <div className="w-1/4 hidden md:block">
                    <FilterSidebar
                        filters={filters}
                        setFilters={setFilters}
                        categories={categories}
                        subCategories={subCategories}
                        brands={brands}
                        products={products}
                    />
                </div>

                <div className="flex-1">
                    <h1 className="text-4xl font-bold text-center mb-10">
                        Our Bestsellers
                    </h1>

                    {filteredProducts.length === 0 ? (
                        <p className="text-center text-sm md:text-lg text-gray-600">
                            Not available product at this location.
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {mobileFilterOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={() => setMobileFilterOpen(false)}
                    />
                    <div className="relative w-3/4 max-w-xs bg-white shadow-lg h-full p-4 overflow-y-auto">
                        <button
                            onClick={() => setMobileFilterOpen(false)}
                            className="mb-4 px-3 py-1 bg-red-500 text-white rounded"
                        >
                            Close
                        </button>
                        <FilterSidebar
                            filters={filters}
                            setFilters={setFilters}
                            categories={categories}
                            subCategories={subCategories}
                            brands={brands}
                            products={products}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllBestsellerProductsPage;
