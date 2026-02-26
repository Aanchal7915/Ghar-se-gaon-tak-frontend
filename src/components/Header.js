import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineShoppingCart,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineHeart,
  HiChevronRight,
} from "react-icons/hi";
import { useCart } from "../context/CartContext";
import { useLocation } from "react-router-dom";
import apiClient from "../services/apiClient";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart(); // Access cartItems from the context

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch categories for the menu
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get("/categories");
        setCategories(response.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Shrink-on-scroll listener
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Animate cart on item count change
  useEffect(() => {
    if (cartItems.length > 0) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen((s) => !s);
    if (isSearchVisible) setIsSearchVisible(false);
  };

  const toggleSearch = () => {
    setIsSearchVisible((s) => !s);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchVisible(false);
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { name: "New Release", path: "/products/recent" },
    { name: "Best Seller", path: "/products/bestseller" },
    { name: "Shop All", path: "/products" },
    { name: "Blog", path: "/blog" },
    { name: "Contact", path: "/contact" },
    { name: "Book Farm Visit", path: "/book-appointment" },
  ];

  const cartCount = cartItems.length;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? "backdrop-blur-lg bg-white/80 shadow-lg text-gray-800"
        : "bg-white/90 backdrop-blur-md text-gray-800 border-b border-gray-100"
        }`}
      role="banner"
    >
      {/* Promo bar */}
      <div className="bg-green-600 text-white py-1.5 px-2 text-[9px] md:text-xs font-bold tracking-widest uppercase overflow-hidden relative">
        <div className="flex animate-marquee whitespace-nowrap min-w-max">
          <span className="px-4">Fresh Organic Vegetables at your doorstep. Get 20% off on your first order!</span>
          <span className="px-4">Fresh Organic Vegetables at your doorstep. Get 20% off on your first order!</span>
          <span className="px-4">Fresh Organic Vegetables at your doorstep. Get 20% off on your first order!</span>
          <span className="px-4">Fresh Organic Vegetables at your doorstep. Get 20% off on your first order!</span>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center transition-all duration-300"
          aria-label="Gaon Se Ghar Tak Home"
        >
          <img src="/final-logo.png" alt="Gaon Se Ghar Tak" className="h-[45px] w-[160px] md:h-[50px] md:w-[200px] object-contain mix-blend-multiply" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 justify-center">
          <ul className="flex items-center space-x-8">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="font-medium text-gray-600 hover:text-green-800 transition-colors duration-200"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right actions (desktop) */}
        <div className="hidden md:flex items-center space-x-6">
          <form
            onSubmit={handleSearch}
            className="flex items-center rounded-full bg-white/70 backdrop-blur px-3 py-1 border border-transparent focus-within:border-green-300 transition-all duration-200 shadow-sm"
          >
            <HiOutlineSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-40 text-sm py-1"
            />
          </form>

          {user ? (
            <div className="flex items-center space-x-4">
              <Link
                to={user.role === "admin" ? "/admin" : user.role === "delivery" ? "/delivery" : "/myorders"}
                className="text-gray-600 hover:text-green-800 transition-colors"
                title="Account"
              >
                <HiOutlineUser className="w-6 h-6" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-green-800 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-gray-600 hover:text-green-800 transition-colors font-medium">
              Login
            </Link>
          )}

          <Link to="/wishlist" className="text-gray-600 hover:text-red-500 transition-colors" title="Wishlist">
            <HiOutlineHeart className="w-6 h-6" />
          </Link>

          <Link to="/cart" className="relative text-gray-600 hover:text-green-800 transition-colors" title="Cart">
            <HiOutlineShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center transition-all duration-300 transform ${animateCart ? "scale-125" : "scale-100"}`}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile icons */}
        <div className="md:hidden flex items-center space-x-2">
          <button onClick={toggleSearch} className="text-gray-600 p-2"><HiOutlineSearch className="w-6 h-6" /></button>
          <Link to="/cart" className="relative text-gray-600 p-2">
            <HiOutlineShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button onClick={toggleMenu} className="text-gray-600 p-2">
            {isMenuOpen ? <HiOutlineX className="w-7 h-7" /> : <HiOutlineMenu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile search expanded */}
      {isSearchVisible && (
        <div className="md:hidden px-4 pb-4 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleSearch} className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl outline-none border-none focus:ring-2 focus:ring-green-500/20"
            />
          </form>
        </div>
      )}

      {/* Enhanced Mobile slide-in menu */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-all duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleMenu} />
        <aside className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>

          {/* Menu Header */}
          <div className="p-5 border-b flex items-center justify-between bg-gray-50">
            <Link to="/" onClick={toggleMenu}>
              <img src="/final-logo.png" alt="Logo" className="h-8 w-auto object-contain mix-blend-multiply" />
            </Link>
            <button onClick={toggleMenu} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><HiOutlineX className="w-6 h-6" /></button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* User Info Section */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-white">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">Hi, {user.name || "User"}</h3>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              ) : (
                <Link to="/login" onClick={toggleMenu} className="flex items-center space-x-3 text-green-600 font-bold">
                  <div className="w-10 h-10 border-2 border-dashed border-green-200 rounded-full flex items-center justify-center">
                    <HiOutlineUser className="w-5 h-5" />
                  </div>
                  <span>Sign In / Register</span>
                </Link>
              )}
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-2 gap-4 p-6 border-b">
              <Link to="/cart" onClick={toggleMenu} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                <div className="relative mb-1">
                  <HiOutlineShoppingCart className="w-6 h-6 text-gray-700" />
                  {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
                </div>
                <span className="text-xs font-medium text-gray-600">Cart</span>
              </Link>
              <Link to="/wishlist" onClick={toggleMenu} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors">
                <HiOutlineHeart className="w-6 h-6 text-gray-700 mb-1" />
                <span className="text-xs font-medium text-gray-600">Wishlist</span>
              </Link>
            </div>

            {/* Navigation Navigation */}
            <nav className="p-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-4">Main Menu</h4>
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      onClick={toggleMenu}
                      className="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <span className="font-medium">{link.name}</span>
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Categories Section */}
              {categories.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-4">Shop By Category</h4>
                  <ul className="space-y-1">
                    {categories.slice(0, 8).map((cat) => (
                      <li key={cat._id}>
                        <Link
                          to={`/categories/${cat._id}`}
                          onClick={toggleMenu}
                          className="flex items-center p-2 text-gray-600 hover:text-green-800 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden mr-3">
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-sm font-medium">{cat.name}</span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link to="/products" onClick={toggleMenu} className="block p-3 text-green-600 text-sm font-bold text-center border-t mt-2">
                        View All Categories
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </nav>
          </div>

          {/* User Actions Footer */}
          <div className="p-6 border-t bg-gray-50 mt-auto">
            {user ? (
              <div className="space-y-4">
                <div className="space-y-1 pb-4 border-b border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Quick Access</h4>
                  <Link to="/products/recent" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">New Release</span>
                  </Link>
                  <Link to="/products/bestseller" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Best Seller</span>
                  </Link>
                  <Link to="/products" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Shop All</span>
                  </Link>
                  <Link to="/contact" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Contact</span>
                  </Link>
                  <Link to="/book-appointment" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Book Visit</span>
                  </Link>
                  <Link to="/blog" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Blog</span>
                  </Link>
                  <Link to="/wishlist" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Wishlist</span>
                  </Link>
                </div>
                <div className="space-y-3">
                  <Link
                    to={user.role === "admin" ? "/admin" : user.role === "delivery" ? "/delivery" : "/myorders"}
                    onClick={toggleMenu}
                    className="flex items-center justify-center space-x-2 w-full py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium shadow-sm"
                  >
                    <HiOutlineUser className="w-4 h-4" />
                    <span>Account Dashboard</span>
                  </Link>
                  <button
                    onClick={() => { handleLogout(); toggleMenu(); }}
                    className="w-full py-2.5 text-red-600 text-sm font-bold hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1 pb-4 border-b border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Quick Access</h4>
                  <Link to="/products/recent" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">New Release</span>
                  </Link>
                  <Link to="/products/bestseller" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Best Seller</span>
                  </Link>
                  <Link to="/products" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Shop All</span>
                  </Link>
                  <Link to="/contact" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Contact</span>
                  </Link>
                  <Link to="/book-appointment" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Book Visit</span>
                  </Link>
                  <Link to="/blog" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Blog</span>
                  </Link>
                  <Link to="/wishlist" onClick={toggleMenu} className="flex items-center p-2 text-gray-700 hover:bg-white rounded-lg transition-all">
                    <span className="text-sm font-medium">Wishlist</span>
                  </Link>
                </div>
                <Link
                  to="/login"
                  onClick={toggleMenu}
                  className="block w-full py-3 bg-green-600 text-white text-center rounded-xl font-bold shadow-lg shadow-green-200"
                >
                  Login to Your Account
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </header>
  );
};

export default Header;