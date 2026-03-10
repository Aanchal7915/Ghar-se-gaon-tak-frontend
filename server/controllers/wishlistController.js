const User = require('../models/User');
const Product = require('../models/Product');

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const productId = req.params.productId;
    const { pincode } = req.body;

    const exists = user.wishlist.some(
      (item) => item && item.product && item.product.toString() === productId && item.pincode === pincode
    );

    if (!exists) {
      user.wishlist.push({ product: productId, pincode });
      await user.save();
    }

    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    console.error('Wishlist addition error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const productId = req.params.productId;
    const { pincode } = req.query;

    user.wishlist = user.wishlist.filter(
      (item) => !(item && item.product && item.product.toString() === productId && item.pincode === pincode)
    );
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    console.error('Wishlist removal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user wishlist
exports.getWishlist = async (req, res) => {
  try {
    const { pincode } = req.query;
    const user = await User.findById(req.user.id).populate('wishlist.product');

    // Filter by pincode if provided
    let results = user.wishlist;
    if (pincode) {
      results = results.filter(item => item.pincode === pincode);
    }

    // Transform to return just product objects to maintain compatibility with frontend expected format
    // but we can also return them as is, however many components expect Array<Product>
    const products = results.map(item => {
      if (!item || !item.product) return null;
      const prod = item.product.toObject();
      return {
        ...prod,
        wishlistPincode: item.pincode
      };
    }).filter(Boolean);

    res.json(products);
  } catch (err) {
    console.error('Wishlist retrieval error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
