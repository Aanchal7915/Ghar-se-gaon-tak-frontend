// import React, { useState, useEffect } from 'react';
// import apiClient from '../services/apiClient';


// const UserManagement = ({ onUserListUpdated }) => {
//     const [users, setUsers] = useState([]);
//     const [filteredUsers, setFilteredUsers] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [activeFilter, setActiveFilter] = useState('delivery'); // Default filter to 'delivery'
//     const [searchTerm, setSearchTerm] = useState('');

//     const fetchUsers = async () => {
//     setLoading(true);
//     try {
//         const response = await apiClient.get('/users'); // token auto-attached by apiClient
//         setUsers(response.data);
//         if (onUserListUpdated) {
//             onUserListUpdated();
//         }
//     } catch (error) {
//         console.error('Failed to fetch users:', error.response?.data?.message || error.message);
//     } finally {
//         setLoading(false);
//     }
// };


//     useEffect(() => {
//         fetchUsers();
//     }, []);

//     useEffect(() => {
//         const lowercasedSearchTerm = searchTerm.toLowerCase();
//         let results = users;

//         // Apply role filter first
//         if (activeFilter !== 'all') {
//             results = users.filter(user => user.role === activeFilter);
//         }

//         // Apply search term filter
//         if (searchTerm) {
//             results = results.filter(user =>
//                 user.name.toLowerCase().includes(lowercasedSearchTerm) ||
//                 user.email.toLowerCase().includes(lowercasedSearchTerm) ||
//                 (user.phone && user.phone.toLowerCase().includes(lowercasedSearchTerm))
//             );
//         }
//         setFilteredUsers(results);
//     }, [users, activeFilter, searchTerm]);

//     const handleDeleteUser = async (userId) => {
//         const confirmDelete = window.confirm('Are you sure you want to delete this user?');
//         if (!confirmDelete) return;

//         try {
//             const token = localStorage.getItem('token');
//             await (`/users/${userId}`, {
//                 headers: { 'Authorization': `Bearer ${token}` },
//             });
//             alert('User deleted successfully!');
//             fetchUsers();
//         } catch (error) {
//             console.error('Failed to delete user:', error);
//             alert('Failed to delete user.');
//         }
//     };

//     if (loading) return <div className="text-center mt-10">Loading users...</div>;

//     return (
//         <div className="p-6 bg-white shadow-md rounded-lg">
//             <h2 className="text-2xl font-bold mb-4">User Management</h2>

//             {/* Filter and Search Section */}
//             <div className="mb-6">
//                 <div className="flex space-x-4 mb-4">
//                     <button 
//                         onClick={() => setActiveFilter('all')} 
//                         className={`py-2 px-4 rounded-md ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
//                     >
//                         All ({users.length})
//                     </button>
//                     <button 
//                         onClick={() => setActiveFilter('customer')} 
//                         className={`py-2 px-4 rounded-md ${activeFilter === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
//                     >
//                         Customers ({users.filter(u => u.role === 'customer').length})
//                     </button>
//                     <button 
//                         onClick={() => setActiveFilter('delivery')} 
//                         className={`py-2 px-4 rounded-md ${activeFilter === 'delivery' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
//                     >
//                         Delivery Partners ({users.filter(u => u.role === 'delivery').length})
//                     </button>
//                     <button 
//                         onClick={() => setActiveFilter('admin')} 
//                         className={`py-2 px-4 rounded-md ${activeFilter === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
//                     >
//                         Admins ({users.filter(u => u.role === 'admin').length})
//                     </button>
//                 </div>
//                 <input
//                     type="text"
//                     placeholder="Search by name, email, or phone"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full p-2 border rounded-md"
//                 />
//             </div>

//             {/* User List */}
//             <div className="space-y-4">
//                 {filteredUsers.length > 0 ? (
//                     filteredUsers.map(user => (
//                         <div key={user._id} className="flex justify-between items-center p-4 bg-gray-100 rounded-md">
//                             <div>
//                                 <p className="font-semibold">{user.name}</p>
//                                 <span className="text-sm text-gray-500 capitalize">{user.email} | {user.role}</span>
//                                 {user.phone && <p className="text-sm text-gray-500">Phone: {user.phone}</p>}
//                             </div>
//                             <button onClick={() => handleDeleteUser(user._id)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Delete</button>
//                         </div>
//                     ))
//                 ) : (
//                     <p>No users found for this filter.</p>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default UserManagement;

// src/components/UserManagement.js
import React, { useState, useEffect } from "react";
import apiClient from "../services/apiClient";

const UserManagement = ({ onUserListUpdated }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasNotifiedParent, setHasNotifiedParent] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log("Fetching users from /users...");
      const response = await apiClient.get("/users");
      console.log("Users fetched:", response.data);

      setUsers(response.data);

      // 🔧 notify parent only once
      if (!hasNotifiedParent && onUserListUpdated) {
        onUserListUpdated();
        setHasNotifiedParent(true);
      }
    } catch (error) {
      console.error(
        "Failed to fetch users:",
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    let results = users;

    if (activeFilter !== "all") {
      results = users.filter((user) => user.role === activeFilter);
    }

    if (searchTerm) {
      results = results.filter(
        (user) =>
          user.name.toLowerCase().includes(lowercasedSearchTerm) ||
          user.email.toLowerCase().includes(lowercasedSearchTerm) ||
          (user.phone &&
            user.phone.toLowerCase().includes(lowercasedSearchTerm))
      );
    }

    setFilteredUsers(results);
  }, [users, activeFilter, searchTerm]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      console.log(`Deleting user ${userId}...`);
      await apiClient.delete(`/users/${userId}`);
      alert("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user.");
    }
  };

  if (loading) return <div className="text-center mt-10">Loading users...</div>;

  return (
    <div className="p-3 md:p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl md:text-2xl font-bold mb-4">User Management</h2>

      {/* Filter + Search */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveFilter("all")}
            className={`py-2 px-4 rounded-md text-sm md:text-base ${activeFilter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
              }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setActiveFilter("customer")}
            className={`py-2 px-4 rounded-md text-sm md:text-base ${activeFilter === "customer"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
              }`}
          >
            Customers ({users.filter((u) => u.role === "customer").length})
          </button>
          <button
            onClick={() => setActiveFilter("delivery")}
            className={`py-2 px-4 rounded-md text-sm md:text-base ${activeFilter === "delivery"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
              }`}
          >
            Delivery ({users.filter((u) => u.role === "delivery").length})
          </button>
          <button
            onClick={() => setActiveFilter("admin")}
            className={`py-2 px-4 rounded-md text-sm md:text-base ${activeFilter === "admin"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
              }`}
          >
            Admins ({users.filter((u) => u.role === "admin").length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name, email, or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>

      {/* User List */}
      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-100 rounded-md gap-4"
            >
              <div className="w-full">
                <p className="font-semibold text-base md:text-lg">{user.name}</p>
                <span className="text-sm text-gray-500 capitalize">
                  {user.email} | {user.role}
                </span>
                {user.phone && (
                  <p className="text-sm text-gray-500">Phone: {user.phone}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteUser(user._id)}
                className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p>No users found for this filter.</p>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
