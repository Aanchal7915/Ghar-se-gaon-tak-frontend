// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import ProductCard from '../components/ProductCard'; // Import the ProductCard component
// import LoadingSpinner from '../components/LoadingSpinner';
// const CategoryProductsPage = () => {
//   const { categoryId } = useParams();
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchProductsByCategory = async () => {
//       try {
//         setLoading(true);
//         // Correctly fetch from the new backend route
//         const response = await fetch(`/products/category/${categoryId}`);
//         if (!response.ok) {
//           throw new Error('Failed to fetch products for this category');
//         }
//         const data = await response.json();
//         setProducts(data);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (categoryId) {
//       fetchProductsByCategory();
//     }
//   }, [categoryId]);

//   if (loading) return <LoadingSpinner />
//   if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>;

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Products in this Category</h1>
//       {products.length === 0 ? (
//         <p className="text-center text-lg text-gray-600">No products found for this category.</p>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
//           {products.map((product) => (
//             <ProductCard key={product._id} product={product} /> // Use the ProductCard component
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default CategoryProductsPage;

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../services/apiClient";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import FilterSidebar from "../components/FilterSidebar";


const CategoryProductsPage = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    price: [0, 100000],
    gender: [],
    category: [],
    subCategory: [],
    size: [],
    brand: [],
  });

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const pincode = localStorage.getItem("selectedPincode");
        // Fetch products with pincode
        const productsResponse = await apiClient.get(`/products/category/${categoryId}`, {
          params: { pincode }
        });
        setProducts(productsResponse.data);

        // Fetch category name
        try {
          const categoryResponse = await apiClient.get(`/categories/${categoryId}`);
          setCategoryName(categoryResponse.data.name);
        } catch (catErr) {
          console.error("Failed to fetch category details:", catErr);
          setCategoryName("Category");
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }
    };

    if (categoryId) fetchData();

    const handlePincodeUpdate = () => {
      if (categoryId) fetchData();
    };
    window.addEventListener("pincode-updated", handlePincodeUpdate);
    return () => window.removeEventListener("pincode-updated", handlePincodeUpdate);
  }, [categoryId]);


  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>;

  // ✅ Filtering logic...
  const filteredProducts = products.filter((p) => {
    const priceMatch = p.variants?.some(
      (v) => v.price >= filters.price[0] && v.price <= filters.price[1]
    );
    const genderMatch =
      filters.gender.length === 0 || filters.gender.includes(p.gender);
    const categoryMatch =
      filters.category.length === 0 || filters.category.includes(p.categoryName);
    const subCategoryMatch =
      filters.subCategory.length === 0 ||
      filters.subCategory.includes(p.subCategory);
    const sizeMatch =
      filters.size.length === 0 ||
      p.variants?.some((v) => filters.size.includes(v.size));
    const brandMatch =
      filters.brand.length === 0 || filters.brand.includes(p.brand);

    return (
      priceMatch &&
      genderMatch &&
      categoryMatch &&
      subCategoryMatch &&
      sizeMatch &&
      brandMatch
    );
  });

  const categories = [...new Set(products.map((p) => p.categoryName || "").filter(Boolean))];
  const subCategories = [...new Set(products.map((p) => p.subCategory || "").filter(Boolean))];
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">
        {categoryName || "Products"}
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Desktop */}
        <div className="hidden md:block w-1/4">
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            subCategories={subCategories}
            brands={brands}
            products={products}
          />
        </div>

        {/* Mobile Filter */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-semibold shadow-sm flex items-center gap-1"
          >
            {mobileFilterOpen ? "Close Filters" : "Open Filters"}
          </button>
          {mobileFilterOpen && (
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              subCategories={subCategories}
              brands={brands}
              products={products}
            />
          )}
        </div>

        {/* Products */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <p className="text-center text-lg text-gray-600">
              No products match your filters.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryProductsPage;