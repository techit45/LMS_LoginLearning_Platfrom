import React from 'react';

const AdminUsersPageSimple = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management (Simple Test)</h1>
      <p>If you can see this message, the routing is working correctly!</p>
      <div className="mt-4 p-4 bg-green-100 rounded-lg">
        <p className="text-green-800">✅ Component mounting successful</p>
        <p className="text-green-600">Check browser console for debug logs</p>
      </div>
    </div>
  );
};

export default AdminUsersPageSimple;