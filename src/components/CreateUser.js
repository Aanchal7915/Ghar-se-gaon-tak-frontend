// src/components/CreateUser.js
import React, { useState } from 'react';

import apiClient from '../services/apiClient';
const CreateUser = ({ onUserCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await apiClient.post('/auth/signup', { name, email, password, phone, role }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessage('User created successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setRole('customer');
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error) {
      setMessage('Failed to create user. Check if email already exists.');
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl md:text-2xl font-bold mb-4">Create New User Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full p-2 border rounded-md" required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded-md" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border rounded-md" required />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-2 border rounded-md" required />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border rounded-md">
          <option value="customer">Customer</option>
          <option value="delivery">Delivery Partner</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">Create Account</button>
      </form>
      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
};

export default CreateUser;