// VisitInStoreSection.js - Updated to use public assets

// const VisitInStoreSection = () => {
//     // Animation variants
//     const sectionVariants = {
//         hidden: { opacity: 0, y: 50 },
//         visible: {
//             opacity: 1,
//             y: 0,
//             transition: {
//                 type: 'spring',
//                 stiffness: 70,
//                 damping: 20,
//                 when: 'beforeChildren',
//                 staggerChildren: 0.2,
//             },
//         },
//     };

//     const imageVariants = {
//         hidden: { opacity: 0, x: -50 },
//         visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
//     };

//     const contentVariants = {
//         hidden: { opacity: 0, x: 50 },
//         visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
//     };

//     const textVariants = {
//         hidden: { opacity: 0, y: 20 },
//         visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
//     };

//     return (
//         <motion.section
//             className="w-full bg-gradient-to-br from-white to-gray-50 py-16 md:py-24"
//             variants={sectionVariants}
//             initial="hidden"
//             whileInView="visible"
//             viewport={{ once: true, amount: 0.3 }}
//         >
//             <div className="container mx-auto px-4">
//                 <div className="flex flex-col md:flex-row items-center bg-white rounded-3xl shadow-2xl overflow-hidden">
//                     {/* Left Section: Image */}
//                     <motion.div
//                         className="w-full md:w-1/2 h-80 md:h-[450px] relative"
//                         variants={imageVariants}
//                     >
//                         <img
//                             src={storeImage}
//                             alt="Neeman's physical store interior"
//                             className="w-full h-full object-cover"
//                         />
//                         <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
//                     </motion.div>

//                     {/* Right Section: Content */}
//                     <motion.div
//                         className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 text-center md:text-left flex flex-col justify-center items-center md:items-start"
//                         variants={contentVariants}
//                     >
//                         <motion.div variants={textVariants} className="mb-6">
//                             <IoLocationOutline className="text-5xl text-gray-700 mx-auto md:mx-0 mb-4" />
//                             <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
//                                 Experience Us Live: <br /> Visit Our Showrooms!
//                             </h2>
//                         </motion.div>

//                         <motion.p variants={textVariants} className="text-lg text-gray-600 mb-8 max-w-lg">
//                             Discover our exquisite collections firsthand. We're also available at our physical locations.
//                             Find a store near you and step into comfort and style!
//                         </motion.p>

//                         <motion.div variants={textVariants}>
//                             <a
//                                 href="https://share.google/LCArV0GRJEMNur3xn"
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold
//                                            bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl
//                                            transition-all duration-300 transform hover:-translate-y-1 group
//                                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                             >
//                                 <span className="relative z-10">Find Nearest Stores</span>
//                                 {/* Shimmer effect (assuming you have this in your global CSS) */}
//                                 <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-shimmer"></span>
//                             </a>
//                         </motion.div>
//                     </motion.div>
//                 </div>
//             </div>
//         </motion.section>
//     );
// };

// export default VisitInStoreSection;

import React from "react";
import { IoLocationOutline } from "react-icons/io5"; // For the store icon
const storeImage = "/assets/place.jpg";

const VisitInStoreSection = () => {
  return (
    <section className="w-full bg-gradient-to-br from-white to-gray-50 py-4 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center bg-white rounded-2xl md:rounded-3xl shadow-lg md:shadow-2xl overflow-hidden border border-gray-100">
          {/* Left Section: Image */}
          <div className="w-full md:w-1/2 h-48 md:h-[450px] relative">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
              alt="Rohtak Grocery Co. fresh outlet interior"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Right Section: Content */}
          <div className="w-full md:w-1/2 p-4 md:p-12 lg:p-16 text-center md:text-left flex flex-col justify-center items-center md:items-start">
            <div className="mb-4 md:mb-6">
              <IoLocationOutline className="text-3xl md:text-5xl text-green-600 mx-auto md:mx-0 mb-2 md:mb-4" />
              <h2 className="text-xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Visit Our Fresh Outlets: <br className="hidden md:block" /> Experience Quality Live!
              </h2>
            </div>

            <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 max-w-lg">
              Come and explore our wide range of organic produce and daily essentials.
              Visit our physical outlets for a personalized shopping experience and the freshest picks of the day!
            </p>

            <div>
              <a
                href="https://share.google/LCArV0GRJEMNur3xn"
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex items-center justify-center px-6 py-2 md:px-8 md:py-4 text-sm md:text-lg font-semibold
                           bg-green-600 text-white rounded-full shadow-md md:shadow-lg hover:shadow-xl
                           transition-all duration-300 transform hover:-translate-y-1 group
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <span className="relative z-10">Gaon Se Ghar Tak</span>
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisitInStoreSection;
