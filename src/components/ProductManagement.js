

import React, { useState, useEffect } from 'react';

import apiClient from '../services/apiClient';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    category: '',
    gender: '',
    subCategory: '',
    isFeatured: false,
    isBestseller: false,
    videoUrl: '',
    farmerName: '',
    farmerPhone: '',
    farmerLocation: '',
    farmerEmail: '',
    isComingSoon: false,
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [newCategoryImagePreview, setNewCategoryImagePreview] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [variants, setVariants] = useState([{ size: '', price: '', originalPrice: '', discount: '', countInStock: '' }]);
  const [pincodePricingRows, setPincodePricingRows] = useState([{ pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]);
  const [pincodeLocationMap, setPincodeLocationMap] = useState({});
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [refreshCategories, setRefreshCategories] = useState(false);
  const [refreshProducts, setRefreshProducts] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [refreshCategories, refreshProducts]);

  const extractPincodes = (value = '') => value
    .split(',')
    .map((p) => p.trim())
    .filter((p) => /^\d{6}$/.test(p));

  const resolvePincodeLocation = async (pincode) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      const postOffice = data?.[0]?.PostOffice?.[0];
      if (!postOffice) return '';
      return `${postOffice.District}, ${postOffice.State}`;
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    const allPincodes = [...new Set(
      pincodePricingRows.flatMap((row) => extractPincodes(row.pincodes))
    )];

    if (!allPincodes.length) return;

    let isMounted = true;
    const fetchLocations = async () => {
      for (const pincode of allPincodes) {
        if (pincodeLocationMap[pincode]) continue;
        const location = await resolvePincodeLocation(pincode);
        if (!isMounted || !location) continue;
        setPincodeLocationMap((prev) => (prev[pincode] ? prev : { ...prev, [pincode]: location }));
      }
    };

    fetchLocations();
    return () => {
      isMounted = false;
    };
  }, [pincodePricingRows, pincodeLocationMap]);

  useEffect(() => {
    const allPincodes = [...new Set(
      pincodePricingRows.flatMap((row) => extractPincodes(row.pincodes))
    )];
    if (!allPincodes.length) return;

    const uniqueLocations = [...new Set(
      allPincodes
        .map((pincode) => pincodeLocationMap[pincode])
        .filter(Boolean)
    )];

    if (!uniqueLocations.length) return;

    const mergedLocation = uniqueLocations.join(', ');
    setFormData((prev) => (
      prev.farmerLocation === mergedLocation ? prev : { ...prev, farmerLocation: mergedLocation }
    ));
  }, [pincodePricingRows, pincodeLocationMap]);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? All products in this category might lose their link.')) return;
    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Category deleted successfully!');
      setRefreshCategories(prev => !prev);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prevImages => [...prevImages, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
  };

  const handleVideoChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleRemoveImage = (indexToRemove, isExisting) => {
    if (isExisting) {
      setExistingImages(existingImages.filter((_, index) => index !== indexToRemove));
    } else {
      setImages(images.filter((_, index) => index !== indexToRemove));
      setImagePreviews(imagePreviews.filter((_, index) => index !== indexToRemove));
    }
  };

  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const newVariants = [...variants];
    newVariants[index][name] = value;

    const original = parseFloat(newVariants[index].originalPrice);
    const disc = parseFloat(newVariants[index].discount);
    const price = parseFloat(newVariants[index].price);

    if (name === 'originalPrice') {
      if (!isNaN(original) && original > 0) {
        if (!isNaN(price)) {
          newVariants[index].discount = (((original - price) / original) * 100).toFixed(2);
        } else if (!isNaN(disc)) {
          newVariants[index].price = Math.round(original - (original * disc / 100));
        }
      }
    } else if (name === 'discount') {
      if (!isNaN(disc)) {
        if (!isNaN(price) && disc < 100) {
          newVariants[index].originalPrice = Math.round(price / (1 - disc / 100));
        } else if (!isNaN(original)) {
          newVariants[index].price = Math.round(original - (original * disc / 100));
        }
      }
    } else if (name === 'price') {
      if (!isNaN(price)) {
        if (!isNaN(original) && original > 0) {
          newVariants[index].discount = (((original - price) / original) * 100).toFixed(2);
        } else if (!isNaN(disc) && disc < 100) {
          newVariants[index].originalPrice = Math.round(price / (1 - disc / 100));
        }
      }
    }

    setVariants(newVariants);
  };

  const addVariant = () => setVariants([...variants, { size: '', price: '', originalPrice: '', discount: '', countInStock: '' }]);
  const removeVariant = (index) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const handlePincodeRowChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...pincodePricingRows];
    updated[index][name] = value;

    const original = parseFloat(updated[index].originalPrice);
    const disc = parseFloat(updated[index].discount);
    const price = parseFloat(updated[index].price);

    if (name === 'originalPrice') {
      if (!isNaN(original) && original > 0) {
        if (!isNaN(price)) {
          updated[index].discount = (((original - price) / original) * 100).toFixed(2);
        } else if (!isNaN(disc)) {
          updated[index].price = Math.round(original - (original * disc / 100));
        }
      }
    } else if (name === 'discount') {
      if (!isNaN(disc)) {
        if (!isNaN(price) && disc < 100) {
          updated[index].originalPrice = Math.round(price / (1 - disc / 100));
        } else if (!isNaN(original)) {
          updated[index].price = Math.round(original - (original * disc / 100));
        }
      }
    } else if (name === 'price') {
      if (!isNaN(price)) {
        if (!isNaN(original) && original > 0) {
          updated[index].discount = (((original - price) / original) * 100).toFixed(2);
        } else if (!isNaN(disc) && disc < 100) {
          updated[index].originalPrice = Math.round(price / (1 - disc / 100));
        }
      }
    }

    setPincodePricingRows(updated);
  };

  const addPincodeRow = () => setPincodePricingRows([...pincodePricingRows, { pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]);
  const removePincodeRow = (index) => {
    const updated = [...pincodePricingRows];
    updated.splice(index, 1);
    setPincodePricingRows(updated.length ? updated : [{ pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]);
  };

  const buildPincodePricingPayload = () => {
    const expanded = [];
    pincodePricingRows.forEach((row) => {
      if (!row.pincodes || row.price === '' || row.inventory === '') return;
      extractPincodes(row.pincodes)
        .forEach((pincode) => {
          expanded.push({
            pincode,
            location: pincodeLocationMap[pincode] || '',
            size: row.size,
            originalPrice: row.originalPrice !== '' ? Number(row.originalPrice) : null,
            discount: row.discount !== '' ? Number(row.discount) : null,
            price: Number(row.price),
            inventory: Number(row.inventory),
          });
        });
    });
    return expanded;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = new FormData();
    for (const key in formData) data.append(key, formData[key]);
    data.append('variants', JSON.stringify(variants));
    data.append('pincodePricing', JSON.stringify(buildPincodePricingPayload()));
    for (const image of images) data.append('images', image);
    if (videoFile) data.append('video', videoFile);

    try {
      await apiClient.post('/products', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      alert('Product added successfully!');
      resetForm();
      setRefreshProducts(prev => !prev);
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product.');
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category._id,
      gender: product.gender,
      subCategory: product.subCategory || '',
      isFeatured: product.isFeatured || false,
      isBestseller: product.isBestseller || false,
      videoUrl: product.videoUrl || '',
      farmerName: product.farmerName || '',
      farmerPhone: product.farmerPhone || '',
      farmerLocation: product.farmerLocation || '',
      farmerEmail: product.farmerEmail || '',
      isComingSoon: product.isComingSoon || false,
    });
    setVariants(product.variants.map(v => ({
      ...v,
      originalPrice: v.originalPrice || '',
      discount: v.discount || ''
    })));
    setPincodePricingRows(
      product.pincodePricing && product.pincodePricing.length > 0
        ? product.pincodePricing.map((entry) => ({
          pincodes: entry.pincode || '',
          size: entry.size || '',
          originalPrice: entry.originalPrice ?? '',
          discount: entry.discount ?? '',
          price: entry.price ?? '',
          inventory: entry.inventory ?? '',
        }))
        : [{ pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]
    );
    setPincodeLocationMap(
      (product.pincodePricing || []).reduce((acc, entry) => {
        if (entry.pincode && entry.location) acc[entry.pincode] = entry.location;
        return acc;
      }, {})
    );
    setExistingImages(product.images);
    setImages([]);
    setImagePreviews([]);
    setVideoFile(null);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = new FormData();
    for (const key in formData) data.append(key, formData[key]);
    data.append('variants', JSON.stringify(variants));
    data.append('pincodePricing', JSON.stringify(buildPincodePricingPayload()));
    for (const image of images) data.append('images', image);
    for (const imageUrl of existingImages) data.append('existingImages', imageUrl);
    if (videoFile) data.append('video', videoFile);

    try {
      await apiClient.put(`/products/${editingProduct._id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      alert('Product updated successfully!');
      resetForm();
      setRefreshProducts(prev => !prev);
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Failed to update product.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      alert('Product deleted successfully!');
      setRefreshProducts(prev => !prev);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product.');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      brand: '',
      category: '',
      gender: '',
      subCategory: '',
      isFeatured: false,
      isBestseller: false,
      videoUrl: '',
      farmerName: '',
      farmerPhone: '',
      farmerLocation: '',
      farmerEmail: '',
      isComingSoon: false
    });
    setVariants([{ size: '', price: '', originalPrice: '', discount: '', countInStock: '' }]);
    setPincodePricingRows([{ pincodes: '', size: '', originalPrice: '', discount: '', price: '', inventory: '' }]);
    setPincodeLocationMap({});
    setImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setVideoFile(null);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
      <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4">
        <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Product Name" className="w-full p-2 border rounded-md" required />
        <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full p-2 border rounded-md" required />
        <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Brand" className="w-full p-2 border rounded-md" required />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isFeatured"
            id="isFeatured"
            checked={formData.isFeatured}
            onChange={handleInputChange}
            className="w-4 h-4 accent-blue-600"
          />
          <label htmlFor="isFeatured" className="text-gray-700 font-medium cursor-pointer">
            Featured Product
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isBestseller"
            id="isBestseller"
            checked={formData.isBestseller}
            onChange={handleInputChange}
            className="w-4 h-4 accent-green-600"
          />
          <label htmlFor="isBestseller" className="text-gray-700 font-medium cursor-pointer">
            Best Seller Product
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isComingSoon"
            id="isComingSoon"
            checked={formData.isComingSoon}
            onChange={handleInputChange}
            className="w-4 h-4 accent-yellow-600"
          />
          <label htmlFor="isComingSoon" className="text-gray-700 font-medium cursor-pointer">
            Coming Soon (Upcoming Product)
          </label>
        </div>

        {/* Category */}
        {/* Category */}
        <select
          name="category"
          value={formData.category}
          onChange={(e) => {
            if (e.target.value === "new") {
              setShowCategoryForm(true);
              setFormData({ ...formData, category: "" });
            } else {
              setShowCategoryForm(false);
              handleInputChange(e);
            }
          }}
          className="w-full p-2 border rounded-md"
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
          <option value="new">+ Create New Category</option>
        </select>

        {/* Show new category form if selected */}
        {showCategoryForm && (
          <div className="p-4 border rounded-md bg-gray-50 mt-2">
            <h3 className="text-lg font-semibold mb-2">Add New Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-2 border rounded-md mb-2"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setNewCategoryImage(file);
                setNewCategoryImagePreview(URL.createObjectURL(file));
              }}
              className="w-full p-2 border rounded-md mb-2"
            />
            {newCategoryImagePreview && (
              <img src={newCategoryImagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md mb-2" />
            )}
            <button
              type="button"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  const data = new FormData();
                  data.append("name", newCategoryName);
                  if (newCategoryImage) data.append("image", newCategoryImage);

                  const res = await apiClient.post("/categories", data, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
                  });

                  alert("Category created!");
                  setCategories([...categories, res.data]);
                  setFormData({ ...formData, category: res.data._id });
                  setShowCategoryForm(false);
                  setNewCategoryName("");
                  setNewCategoryImage(null);
                  setNewCategoryImagePreview(null);
                } catch (err) {
                  console.error(err);
                  alert("Failed to create category");
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Save Category
            </button>
          </div>
        )}

        {/* Manage Existing Categories */}
        <div className="mt-4 p-4 border rounded-md bg-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Existing Categories (Click &times; to delete)</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat._id} className="flex items-center bg-white border border-gray-300 rounded-full pl-3 pr-1 py-1 shadow-sm hover:border-red-300 transition-all group">
                <span className="text-xs font-bold text-gray-700 mr-2">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white rounded-full p-1 transition-all"
                  title={`Delete ${cat.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>


        {/* Item Type (Mapped to Gender field) */}
        <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-2 border rounded-md" required>
          <option value="">Select Item Type</option>
          <option value="standard">Standard</option>
          <option value="organic">Organic</option>
          <option value="premium">Premium</option>
          <option value="budget">Budget</option>
        </select>

        {/* SubCategory */}
        <input
          type="text"
          name="subCategory"
          value={formData.subCategory}
          onChange={handleInputChange}
          placeholder="Sub Category (e.g., Fruits, Vegetables, Dairy)"
          className="w-full p-2 border rounded-md"
        />

        {/* Video Upload */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Upload Product Video (Optional)</label>
          <input
            type="file"
            name="video"
            accept="video/*,image/*"
            onChange={handleVideoChange}
            className="w-full p-2 border rounded-md border-blue-300"
          />
          {formData.videoUrl && !videoFile && (
            <p className="text-xs text-blue-600">Current video: {formData.videoUrl}</p>
          )}
        </div>

        <h3 className="text-lg font-semibold">Farmer Details</h3>
        <input
          type="text"
          name="farmerName"
          value={formData.farmerName}
          onChange={handleInputChange}
          placeholder="Farmer Name"
          className="w-full p-2 border rounded-md"
        />
        <input
          type="text"
          name="farmerPhone"
          value={formData.farmerPhone}
          onChange={handleInputChange}
          placeholder="Farmer Contact Number"
          className="w-full p-2 border rounded-md"
        />
        <input
          type="text"
          name="farmerLocation"
          value={formData.farmerLocation}
          onChange={handleInputChange}
          placeholder="Farmer Location"
          className="w-full p-2 border rounded-md"
        />
        <input
          type="email"
          name="farmerEmail"
          value={formData.farmerEmail}
          onChange={handleInputChange}
          placeholder="Farmer Email"
          className="w-full p-2 border rounded-md"
        />

        {/* Variants */}
        <h3 className="text-lg font-semibold">Product Variants</h3>
        {variants.map((variant, index) => (
          <div key={index} className="flex space-x-2">
            <input type="text" name="size" value={variant.size} onChange={(e) => handleVariantChange(index, e)} placeholder="Pack/Size" className="w-full p-2 border rounded-md" required />
            <input type="number" name="originalPrice" value={variant.originalPrice} onChange={(e) => handleVariantChange(index, e)} placeholder="Original Price" className="w-full p-2 border rounded-md" />
            <input type="number" name="discount" value={variant.discount} onChange={(e) => handleVariantChange(index, e)} placeholder="Disc %" className="w-full p-2 border rounded-md" />
            <input type="number" name="price" value={variant.price} onChange={(e) => handleVariantChange(index, e)} placeholder="Selling Price" className="w-full p-2 border rounded-md" required />
            <input type="number" name="countInStock" value={variant.countInStock} onChange={(e) => handleVariantChange(index, e)} placeholder="Stock" className="w-full p-2 border rounded-md" required />
            <button type="button" onClick={() => removeVariant(index)} className="bg-red-500 text-white p-2 rounded-md">-</button>
          </div>
        ))}
        <button type="button" onClick={addVariant} className="bg-gray-200 text-gray-800 p-2 rounded-md">Add Variant</button>

        <h3 className="text-lg font-semibold">Pincode Price & Inventory</h3>
        {pincodePricingRows.map((row, index) => (
          <div key={`pincode-row-${index}`} className="space-y-1">
            <div className="flex space-x-2">
              <input
                type="text"
                name="pincodes"
                value={row.pincodes}
                onChange={(e) => handlePincodeRowChange(index, e)}
                placeholder="Pincode(s) e.g. 110001,124001"
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                name="size"
                value={row.size}
                onChange={(e) => handlePincodeRowChange(index, e)}
                placeholder="Pack Size"
                className="w-full p-2 border rounded-md"
                required
              />
              <input
                type="number"
                name="originalPrice"
                value={row.originalPrice}
                onChange={(e) => handlePincodeRowChange(index, e)}
                placeholder="Original Price"
                className="w-full p-2 border rounded-md"
              />
              <input
                type="number"
                name="discount"
                value={row.discount}
                onChange={(e) => handlePincodeRowChange(index, e)}
                placeholder="Disc %"
                className="w-full p-2 border rounded-md"
              />
              <input
                type="number"
                name="price"
                value={row.price}
                onChange={(e) => handlePincodeRowChange(index, e)}
                placeholder="Selling Price"
                className="w-full p-2 border rounded-md"
              />
              <input
                type="number"
                name="inventory"
                value={row.inventory}
                onChange={(e) => handlePincodeRowChange(index, e)}
                placeholder="Inventory"
                className="w-full p-2 border rounded-md"
              />
              <button type="button" onClick={() => removePincodeRow(index)} className="bg-red-500 text-white p-2 rounded-md">-</button>
            </div>
            <p className="text-xs text-gray-600">
              Location: {extractPincodes(row.pincodes)
                .map((pincode) => pincodeLocationMap[pincode] ? `${pincode} - ${pincodeLocationMap[pincode]}` : `${pincode} - Fetching...`)
                .join(', ') || 'N/A'}
            </p>
          </div>
        ))}
        <button type="button" onClick={addPincodeRow} className="bg-gray-200 text-gray-800 p-2 rounded-md">Add Pincode Rule</button>

        {/* Images */}
        <h3 className="text-lg font-semibold">Product Images</h3>
        <input type="file" name="images" multiple onChange={handleImageChange} className="w-full p-2 border rounded-md" />
        <div className="flex flex-wrap space-x-2 mt-2">
          {existingImages.map((url, idx) => (
            <div key={`ex-${idx}`} className="relative">
              <img src={url} alt="" className="h-24 w-24 object-cover rounded-md" />
              <button type="button" onClick={() => handleRemoveImage(idx, true)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full h-6 w-6">&times;</button>
            </div>
          ))}
          {imagePreviews.map((preview, idx) => (
            <div key={`new-${idx}`} className="relative">
              <img src={preview} alt="" className="h-24 w-24 object-cover rounded-md" />
              <button type="button" onClick={() => handleRemoveImage(idx, false)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full h-6 w-6">&times;</button>
            </div>
          ))}
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md">
          {editingProduct ? 'Update Product' : 'Add Product'}
        </button>
        {editingProduct && (
          <button type="button" onClick={resetForm} className="w-full bg-gray-400 text-white p-2 rounded-md">Cancel</button>
        )}
      </form>

      {/* Existing Products */}
      <h2 className="text-2xl font-bold mt-8 mb-4">Existing Products</h2>
      <div className="space-y-4">
        {products.map(product => (
          <div key={product._id} className="flex justify-between items-center p-4 bg-gray-100 rounded-md">
            <div className="flex items-center space-x-4">
              <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded-md" />
              <div>
                <span className="font-semibold">{product.name} - {product.brand}</span>
                <p className="text-sm text-gray-600">Category: {product.category?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">Variants: {product.variants.map(v => (
                  <span key={v._id || v.size} className={`mr-2 ${v.countInStock <= 0 ? 'text-red-600 font-bold' : ''}`}>
                    {v.size}(₹{v.price}): {v.countInStock <= 0 ? 'OUT OF STOCK' : `Qty: ${v.countInStock}`}
                  </span>
                ))}</p>
                <p className="text-xs font-bold mt-1">
                  Total Inventory: {product.variants.reduce((acc, v) => acc + (v.countInStock || 0), 0)} unit(s)
                  {product.variants.every(v => v.countInStock <= 0) && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] uppercase">Sold Out</span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Pincode Rules: {product.pincodePricing && product.pincodePricing.length > 0
                    ? product.pincodePricing.map((rule, idx) => (
                      <span key={`pincode-${product._id}-${idx}`} className="mr-2">
                        {rule.pincode} ({rule.location || 'Location N/A'} - {rule.size} - Rs.{rule.price}): Qty {rule.inventory}
                      </span>
                    ))
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleEditClick(product)} className="bg-yellow-500 text-white px-4 py-2 rounded-md">Edit</button>
              <button onClick={() => handleDeleteProduct(product._id)} className="bg-red-600 text-white px-4 py-2 rounded-md">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductManagement;

