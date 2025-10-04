import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LinkAnalytics from './pages/LinkAnalytics';
import Login from './pages/Login';
import Register from './pages/Register';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
      <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#333', // dark background
                color: '#fff',      // white text
                fontFamily: 'Inter, sans-serif',
              }
            }}
          />
      <Router>
        <AuthProvider>
          <Toaster position="top-right" />
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/:alias" element={<LinkAnalytics />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}
