// src/context/CartContext.js
import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    const existingItem = cartItems.find(
      (item) => item._id === product._id && item.selectedVariant.size === product.selectedVariant.size
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item._id === product._id && item.selectedVariant.size === product.selectedVariant.size
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      );
    } else {
      setCartItems([...cartItems, { ...product, qty: 1 }]);
    }
  };

  const clearCart = () => { // This function is already here
    setCartItems([]);
  };
  const removeFromCart = (id, size) => {
    setCartItems(cartItems.filter((item) => !(item._id === id && item.selectedVariant.size === size)));
  };

  const updateCartQuantity = (id, size, newQty) => {
    if (isNaN(newQty) || newQty <= 0) {
      removeFromCart(id, size);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item._id === id && item.selectedVariant.size === size
          ? { ...item, qty: newQty }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.selectedVariant && item.selectedVariant.price ? item.selectedVariant.price : 0;
      return total + price * item.qty;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateCartQuantity, getTotalPrice, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);