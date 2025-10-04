import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-green-400">URL Shortener</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/" className="hover:text-green-300">Home</Link>

        {user ? (
          <>
            <Link to="/dashboard" className="hover:text-green-300">Dashboard</Link>
            <div className="px-3 py-1 rounded bg-gray-700 text-sm">{user.name || user.email}</div>
            <button onClick={logout} className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-white text-sm">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-green-300">Login</Link>
            <Link to="/register" className="hover:text-green-300">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
