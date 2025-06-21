// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, Outlet, useLocation } from 'react-router-dom';

import Layout from './components/Layout'; // (You could even move Layout to its own file!)
import ResumeUploadPage from './pages/ResumeUpload';
import LoginPage from './pages/Loginpage';
import DashboardPage from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; // (And this!)
import { useAuth } from './hooks/useAuth'; // (And the auth logic!)

// --- Main Application Component with Router ---
function App() {
    const auth = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout auth={auth} />}>
                    {/* Public Routes */}
                    <Route index element={<ResumeUploadPage />} />
                    <Route path="login" element={<LoginPage auth={auth} />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute isAuthenticated={auth.isAuthenticated} />}>
                        <Route path="dashboard" element={<DashboardPage auth={auth} />} />
                    </Route>
                    
                    <Route path="*" element={<div className="text-center"><h2>Page Not Found!</h2></div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
