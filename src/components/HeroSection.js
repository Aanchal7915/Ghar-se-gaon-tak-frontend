import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";
import apiClient from "../services/apiClient";

const groceryData = [
  {
    productName: "Organic Tomatoes",
    productPrice: "₹40/kg",
    productImage: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80",
  },
  {
    productName: "Premium Bananas",
    productPrice: "₹75/dozen",
    productImage: "/banana.jpg",
  },
  {
    productName: "Fresh Bread",
    productPrice: "₹45/pack",
    productImage: "/bread.jpg",
  },
  {
    productName: "Medjool Dates",
    productPrice: "₹250/500g",
    productImage: "/medjhool.jpg",
  }
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/categories');
        // Show first 8 categories like the original design
        setCategories(response.data.slice(0, 8));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="relative flex flex-col bg-white overflow-hidden pt-0 pb-10 md:pb-20">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-white"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center">
        {/* Daily Essentials Banner - Optimized for mobile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[1400px] mb-4 overflow-hidden relative rounded-xl shadow-lg border border-white/10 bg-gradient-to-r from-[#2e7d32] via-[#388e3c] to-[#4caf50] h-[150px] md:h-[260px] flex items-center group cursor-pointer"
          onClick={() => navigate('/products')}
        >
          {/* Content Left */}
          <div className="relative z-10 w-full md:w-[60%] px-4 md:px-16 flex flex-col justify-center">
            <h2 className="text-lg md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-1 md:mb-4 drop-shadow-md">
              Stock up on daily essentials
            </h2>
            <p className="text-white/90 text-[10px] md:text-lg font-medium mb-3 md:mb-8 max-w-[500px] leading-relaxed">
              Get farm-fresh goodness & a range of exotic <br className="hidden md:block" /> fruits, vegetables, eggs & more
            </p>
            <div>
              <button className="bg-yellow-400 text-black font-extrabold py-1.5 px-4 md:px-8 rounded-md text-[10px] md:text-base hover:bg-yellow-500 transition-colors shadow-sm">
                Shop Now
              </button>
            </div>
          </div>

          {/* Image Right Overlay */}
          <div className="absolute right-0 top-0 w-full md:w-[65%] h-full flex justify-end">
            <div className="w-full h-full relative">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
                alt="Daily Essentials"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-[3s]"
              />
              {/* Fade out the image towards the left text area */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#2e7d32] via-[#2e7d32]/30 to-transparent"></div>
            </div>
          </div>
        </motion.div>


        {/* Dome Cards Container - Updated for better mobile fit */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 w-full max-w-[1400px] px-0 md:px-4 pb-16 min-h-[120px] md:min-h-[200px] items-center justify-center">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full"
              />
              <p className="mt-4 text-green-800 font-bold text-sm animate-pulse">Loading Categories...</p>
            </div>
          ) : (
            categories.map((cat, idx) => (
              <motion.div
                key={cat._id || idx}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.05 * idx, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="group flex flex-col items-center cursor-pointer"
                onClick={() => navigate(`/categories/${cat._id}`)}
              >
                <div className="bg-[#b8ead4] rounded-xl overflow-hidden shadow-md relative w-full aspect-[4/5] flex flex-col items-center justify-center border border-yellow-600/10 hover:border-yellow-400/60 transition-all duration-500 group">
                  {/* Intricate Pattern Background */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l20 20M10 0l10 10M0 10l10 10' stroke='%231e4636' stroke-width='1' fill='none'/%3E%3C/svg%3E")` }}></div>

                  {/* Refined Archway Design */}
                  <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/40 to-transparent clip-path-dome"></div>

                  {/* Decorative Elements */}
                  <div className="absolute top-1 left-2 text-[6px] md:text-[8px] text-yellow-700/40">✦</div>
                  <div className="absolute top-1 right-2 text-[6px] md:text-[8px] text-yellow-700/40">✦</div>

                  {/* Content Container */}
                  <div className="relative z-10 flex flex-col items-center w-full h-full pt-4 md:pt-8">
                    {/* Square Image with Glow - Optimized for mobile */}
                    <div className="w-12 h-12 md:w-28 md:h-28 lg:w-34 lg:h-34 rounded-lg overflow-hidden border border-white/80 shadow-[0_0_10px_rgba(255,255,255,0.4)] bg-white/30 p-0.5 transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>

                    {/* Glassmorphism Title Bar */}
                    <div className="mt-auto w-full bg-white/20 backdrop-blur-md border-t border-white/30 py-1.5 md:py-2 group-hover:bg-white/40 transition-colors">
                      <h3 className="text-[#1e4636] text-[7px] sm:text-[9px] md:text-[11px] font-black text-center px-0.5 uppercase tracking-widest leading-tight">
                        {cat.name}
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Re-restored Trending Now Banner */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 
        bg-gradient-to-r from-green-950/95 via-[#1e4636]/90 to-green-900/90 
        backdrop-blur-xl w-[95%] md:w-3/4 rounded-xl 
        p-2 md:p-4 flex items-center justify-between space-x-3 
        overflow-x-auto z-20 shadow-[0_5px_15px_rgba(0,0,0,0.3)] border border-yellow-500/10 no-scrollbar">

        <div className="flex items-center space-x-1 flex-shrink-0">
          <FaFire className="text-yellow-400 animate-pulse w-3 h-3 md:w-4 md:h-4" />
          <span className="font-black tracking-tighter text-yellow-500 uppercase italic text-[10px] md:text-sm whitespace-nowrap">
            TRENDING
          </span>
        </div>

        <div className="flex space-x-3 md:space-x-6 text-sm text-white overflow-x-auto no-scrollbar items-center">
          {groceryData.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-2 min-w-[120px] md:min-w-[160px]
                bg-white/5 border border-white/5 rounded-lg px-2 py-1 shadow-inner 
                hover:bg-white/15 transition-all cursor-pointer group/item"
              onClick={() => navigate('/products')}
            >
              <img
                src={item.productImage}
                alt={item.productName}
                className="w-[28px] h-[28px] md:w-[40px] md:h-[40px] object-cover rounded-md flex-shrink-0 group-hover/item:scale-110 transition-transform"
              />
              <div className="overflow-hidden">
                <p className="font-bold truncate text-[9px] md:text-[12px] group-hover/item:text-yellow-300" title={item.productName}>
                  {item.productName}
                </p>
                <p className="text-yellow-400 font-black text-[8px] md:text-[11px] leading-none">{item.productPrice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .clip-path-dome {
          clip-path: ellipse(60% 70% at 50% 0%);
          background: linear-gradient(to bottom, rgba(255,255,255,0.4), transparent);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default HeroSection;

