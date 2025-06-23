import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

/**
 * The main layout component, updated with a clean and professional design.
 * Features a standard white header and a light background.
 */
function Layout({ auth }) {
    const location = useLocation();

    // Helper to determine if a link is active
    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Clean, professional navigation bar */}
            <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <Link to="/" className="text-2xl font-bold text-indigo-600">Resume AI</Link>
                        </div>
                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center space-x-4">
                            {auth.isAuthenticated ? (
                                <>
                                    <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                                        Upload
                                    </Link>
                                    <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                                        Dashboard
                                    </Link>
                                    <button onClick={auth.logout} className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                                        Upload Resume
                                    </Link>
                                    <Link to="/login" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/login') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                                        Employer Login
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <main className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Outlet /> {/* Child routes will be rendered here */}
                </div>
            </main>
        </div>
    );
}

export default Layout;
