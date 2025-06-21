import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

// --- Main Layout with Navigation ---
function Layout({ auth }) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0">
                            <Link to="/" className="text-2xl font-bold text-blue-600">Resume AI</Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                                Upload Resume
                            </Link>
                            {auth.isAuthenticated ? (
                                <>
                                    <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/dashboard' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                                        Employer Dashboard
                                    </Link>
                                    <button onClick={auth.logout} className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/login' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                                    Employer Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <main className="p-4 sm:p-6 lg:p-8">
                <Outlet /> {/* Child routes will be rendered here */}
            </main>
        </div>
    );
}

export default Layout;